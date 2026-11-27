# Arsenal recipes: Line jobs: what the viewer must get from this line

Generated from the recipe drafts; do not edit by hand. Recipes whose primary job is in this group. Find candidates for a beat with ae_arsenal find; read one with ae_arsenal get, or a section here by its heading.

## Hand-traced script word that draws itself and glows
id: 04-echo-stroke-text-reveal
revision: e51aa5c0
job: reveal-headline; support: light-the-hero, add-impact
status: proven (accepted 2026-11-25)
what it does for a beat: A designer reaches for this when a short word (a greeting, a title) should look written by a glowing line on a dark ground.
what it looks like: A thin single-line script word, centred on black, is drawn stroke by stroke. Strokes have a pale, near-white hot core inside a gold halo; no brighter head or visible trail is seen in the played frames. A wide soft halo of the stroke's colour surrounds the word. The lines then un-draw in the same order, so for a moment the whole word is visible. The author shows gold first and later swaps to violet and mint green.

ingredients:
- Type tool plus a script-style font — built-in; font name and weight not shown (said that a different font is picked; script look is inferred from the result)
- Pen tool, shape layer with several separate stroke-only paths — built-in
- Trim Paths on the shape layer — built-in; Add menu of the shape layer's Contents (said)
- Echo — stock; effect on the shape layer (said; Effect Controls shown)
- Deep Glow — paid (third-party plug-in); shown in Effect Controls
- A bezier-curve preset panel (curve-preset panel) for key easing — extension (third-party); shown

steps:
1. Make a comp of 1920×1080 with a black ground (shown : layer position 960,540; the viewer at 100 % spans 960 of the 1920 small-frame px, i.e. 1920 full-frame px; picture pure black). Black ground itself is inferred, not said.
2. Type a short word with the Type tool and choose a flowing script font (said only that a different font is picked; "flowing script" and the weight are inferred from the result picture). The word here is a two-letter greeting. Centre it (inferred from the later result).
3. Select the Pen tool and draw over the letters as separate open paths, one path per pen stroke (said). Click for a corner point, click-and-drag for a curve point (said). Before the first path, turn Fill off and Stroke on (said; toolbar shown). Stroke colour white, width 2.9 px (shown toolbar "2.9 px", white swatch in Shape 1's Stroke).
   - Each path must be started as a new shape inside the same layer: deselect the path (or click the layer) before the next first point (said, "within the same layer… start another shape"). Result: five shapes in one layer (shown).
   - Paths run in natural writing order; the author mentions they will be re-ordered next.
4. Delete the text layer's text but keep the shape layer (said; the text is gone).
5. With the shape layer open, Add > Trim Paths (said that trim paths is added; menu not on screen, so the path "Add > Trim Paths" is inferred). One Trim Paths 1 sits below the five shapes (shown).
6. Keyframe End (said): the narrator says to set a key somewhere later and change the first value to zero. Result: End 0 % at the first key (shown, reads 0.0 %) and 100 % at the playhead after the second key (shown). The reveal therefore runs 0 → 100 %.
7. Set Trim Multiple Shapes to Individually (said; shown), so the five strokes draw one after the other and not all at once.
8. Re-order the five shapes in the stack so the strokes draw in writing order. The author's final stack is Shape 1 at the top … Shape 5 at the bottom (shown); before it was Shape 5 at the top (shown). Narrated reason: the reveal was running from the wrong end. The top shape draws first: Shape 1 (the first path drawn) is on top, and the played loop (cut from source every 0.25 s) shows the first letter's curl, then its body, then the i last; on un-draw the first letter goes first and the i is last.
9. Key Start too (said): 0 % at the beginning, 100 % at the end. Move both Start keys later than the End keys by about 0.34 s (said "drag them forward"; spacing measured from keys: Start keys at 0.34 s and 1.69 s, End keys at 0 s and 1.35 s). While the Start and End keys were still lined up the layer showed nothing (said).
10. Ease the keys with a bezier curve with handle values 0.33, 0, 0, 1 (preset picked, shown, readout; the narrator only says to apply a graph and that this one looks smooth). That it went onto all four keys is inferred: no frame shows which keys were selected or the Apply press. A 0.76, 0, 0.24, 1 curve is highlighted in the panel before any Trim Paths exists; whether it was ever tried on these keys is not shown. The values 85.9 % and 97.0 % at about 48 % / 73 % through the spans match this curve, so it is on at least the keys that showed them (inferred).
11. Pick the stroke colour: select all five shapes with Shift (said), change the stroke colour; the author starts at gold (typed value not shown; the swatch reads about 253,195,74 in the recording, a saturated mid-tone from a screen recording that may be over-saturated from a wide-gamut display, so not a target).
12. Add Echo to the shape layer (said; shown):
   - Echo Time: −0.013 s (shown; the sign's meaning as trailing is inferred; it is under one frame of 0.033 s) — the author's earlier trials (−0.033, 0.333, 1.033) are passed-through values.
   - Number Of Echoes: 10 (said; shown)
   - Starting Intensity: 0.15 (shown; it was 1.00, then 1.08 on the way, the author says "decrease it so it's more subtle"; said)
   - Decay: 1.00 (shown; untouched)
   - Echo Operator: Maximum (said; shown)
13. Add Deep Glow on top of Echo (said; shown, order Echo then Deep Glow in Effect Controls):
   - Radius: 500 first (shown); later raised to 857 (shown, readout 857.00).
   - Exposure: 1.00 first (shown); later 1.10 (shown).
   - Blend Mode (Style): Screen first (shown); then "Add" (shown). The narrator says to play with the blend mode; the final list shows Add.
   - Other settings left at default (shown : Source Opacity 100 %, Unmult on, View Final Render).
14. The author floats sliding the key set later so the full word shows longer, then drops it ("this is perfect"); the keys do not move (show the same positions). Not a step.
15. Optional restyle at the end (said): other colours — violet typed as hex C34CFF (R195 G76 B255) (shown dialog), then a mint green (typed value not shown; recording swatch ≈ 74,252,171, wide-gamut caution as above, not a target). The stroke width was dragged to 11 px and 5.4 px as tests (shown, s645) and ended back at 2.9 px (shown source frame, panel reads 2.9).

layout: Comp 1920×1080 (inferred from layer position 960,540, shown). Measured (viewer at 158.2 %, 1 comp px ≈ 0.79 px of the 1920-wide frame): the word's selection box is about 233 px wide and 152 px high (12 % of picture width × 14 % of height; measured); centred in the picture (box centre within 1 % of picture centre; measured). Stroke width 2.9 px (shown). The word is built of five open paths in one layer, one per pen stroke; the crossbar of the first letter and the i are separate strokes (measured: the i is drawn last and is the last to vanish).
  Each stroke carries the effect: all five are in one layer, so Echo and Deep Glow act on the group as one.
  Glow: a soft round halo of the stroke colour, centred on the word, visible out to about 190–240 px from the word's centre (about 18–22 % of picture height; measured with Radius 500 and Exposure 1.00); at Radius 857 / Exposure 1.10 it is wider and brighter. The ground outside it is flat black. No shadows, no grain.
  Stroke core: the line itself reads pale yellow-white with a darker gold glow around it. The stroke colour is the typed gold; the light core is inferred to come from Deep Glow adding light over the thin gold line (Exposure 1.00, Screen), not from a different stroke colour.
  Brightness: strokes read even in brightness in frames; no bright head, no visible trail (echo spacing is under a frame). Echo settings are as shown; their visible effect is slight.
  Motion: the top shape draws first: the first letter's curl, then its body, then the i; strokes overlap somewhat in time (part of the i while the first letter's legs still draw), so it is not strictly one after another. On un-draw the first letter goes first and the i is last (whole word, first letter partly gone, only the i left). The Start trim follows 0.34 s behind the End trim, so a line of constant length travels, then the word is all there for a short moment. Speed per second is not given.
  The finished example on screen is the author's own build, the same layer; later colour swaps are in the same layer. Gold with Radius 500 is the version in the result window; the Radius 857, Exposure 1.10, Add version is seen only with selection handles. The word in the result window is the author's own build.

timing and easing: Four keys. End: 0 s (0 %) → about 1.35 s (100 %). Start: about 0.34 s (0 %) → about 1.69 s (100 %). Times measured from the key marker positions, start-to-end spans equal (1.35 s ≈ 40 frames at 29.97 fps). The curve with handles 0.33, 0, 0, 1 is shown; all four keys carrying it is inferred: a fast start and a long soft landing. The author mentions but does not do a later move of the keys.
variations: Another colour, stroke width, blend mode (said), glow radius/exposure (said), (timing was floated, not done). The author calls out the order of strokes as something to get right.
pitfalls: Strokes that start in the same shape will trim together; start each path as a new shape (said). If Trim Multiple Shapes stays on Simultaneously all strokes draw at once, and with Individually the stack order decides who draws first (said). If Start and End keys line up, nothing shows (said).
build notes: Create a shape layer; add five Path groups (Shape 1–5), each with a Stroke (white, 2.9) and no fill; add Trim Paths to the layer's Contents (Trim Paths sits below the groups) and set Trim Multiple Shapes to Individually (property "Trim Multiple Shapes" = 2). Keyframe Trim Paths 1 "Start" and "End". Apply Echo (property names: Echo Time (seconds), Number Of Echoes, Starting Intensity, Decay, Echo Operator) then Deep Glow (Radius, Exposure, Style > Blend Mode). Paths must be hand-drawn; scripted, build them from the traced point lists (not given). The Flow easing is set by hand; use a temporal ease for the 0.33, 0, 0, 1 curve (see easing).
unknowns: Font name; the exact path points; typed gold stroke value; timing figures between the keys beyond measured marker positions; whether Trim Paths direction was 100→0 or 0→100 for the Start keys (only the reading from the preview was used); the exact keys' frames after the later "move forward" step; the stroke colour of the white pre-colour paths in the result window is gold (not white).

## Solid logo fading in over a glowing outline, with a hot highlight and a small scale-down
id: 05-fill-reveal-with-composite-and-highlight
revision: 4dcda4ff
job: introduce-tool; support: add-impact, light-the-hero
status: proven (accepted 2026-11-26)
what it does for a beat: When a thin glowing outline logo should land as a finished, solid, clean logo: the outline's glow dies away, a flare flashes over the top of the shape, the solid fill fades in and the whole logo settles slightly smaller.
what it looks like: On black, coloured and white outline fragments grow and bloom into a soft haze. A hot white flare flashes over the top of the shape and the grey, half-faded solid logo shows through it. Then the haze and outlines vanish and a plain white logo holds, about three quarters of its starting size, with no glow around it.

ingredients:
- CC Composite — stock; Effect > Channel > CC Composite (shown : found by searching "cc com" in Effects & Presets, it sits in the Channel folder). The narrator's word was "CC composite"; the screen agrees.
- CC Light Sweep (three copies, from earlier techniques: 01 and 02 edge outline, 04 sweep width) — stock; used here for keys on Width, Edge Intensity and Sweep Intensity (shown).
- Glow (four copies from 03-stacked-glow-on-outline) — stock; only present, nothing is changed on them here.
- Fill (top of the stack, from 01-edge-only-outline-from-logo) — stock; present, not changed (shown).
- Scale on the layer's Transform — built-in.
- Keyframes — built-in.

Starting state (shown): one logo layer, white solid logo as source, effect stack top to bottom Fill, CC Light Sweep, CC Light Sweep 2, CC Light Sweep 3, Glow, Glow 2, Glow 3, Glow 4. Comp 1920 × 1080 at 30 fps (the time display reads "30.00 fps"), 50 % viewer, black ground. The outline and glow play as the earlier techniques made them. Keys already on the sweeps (shown, playhead 6:16): Direction on each sweep has keys at 0 and 5:02 only. Width on sweeps 2 and 3 has two keys, at 0 and about 1:17 (value 79.0). Width on sweep 1 has four keys: 0, about 1:17, 5:02 and a fourth near 5:26, and its value reads 240.0 there (the fourth key is the 240 one). The effects result shows only the glowing outline, no solid fill.

steps:
1. Search "cc com" in Effects & Presets and drag CC Composite onto the logo layer. It lands at the bottom of the stack under Glow 4. (said "drag it on to this"; stack position shown)
   - Composite Original: In front (shown; left as it came, inferred default)
   - RGB Only: ticked (shown; inferred left at default)
   - Opacity: 100 % at first (shown). Result right after: the solid white logo sits on top of the outline glow, so the fill now covers the outline.
2. Opacity stopwatch on, so there are two keys: 0 % early and 100 % later. First placed with the playhead at 5:02 for the 0 % key and at 6:06 for the 100 % key. (said for "keyframe for opacity", "set to 0", "set to 100"; key positions shown : keys at 5:02 and 6:06, value 100 % at 6:06 read)
   - Opacity key 1: 0 % (said "0"; shown reads 0.0 % before the first key)
   - Opacity key 2: 100 % (said "100"; shown reads 100.0 % at 6:22 with the key selected)
3. Later the author slides both opacity keys later so the fill comes up a little after the glow starts, ("come up little later" said). The final keys: 0 % at about 5:18 (inferred from the key's place between the 5:02 and 5:20 keys on the ruler; 5:18 is my reading, ± 1 frame) and 100 % at 6:22 (shown : playhead at 6:22, key selected). (said, shown vs)
4. Remove the leftover glow: bring the sweeps' Width to 0 by the time the fill is there (the link from sweeps to glow is inferred). Both CC Light Sweep 2 and 3: Width key 79 at 5:02 and a new key Width 0 at 6:06 (said: widths of all the sweeps go to 0; shown reads 0.0 on sweeps 2 and 3 with key at 6:06; 79 at 5:02 shown reads 79.0 on both)
   - CC Light Sweep (first one): Width keys 79 at 5:02 (shown), 240 at 5:20 (shown) and 0 at 6:22 (shown reads 0.0). The 240 key is not new: it is the fourth key sweep 1 already had (near 5:26), which was moved to 5:20 (shown: has it near 5:20, no key yet at 6:06). Only the 0 key was added, first at 6:06 and then slid to 6:22.
   - Why it matters: the sweeps' Width goes to 0 so their outline contribution is gone once the fill is up (inferred; the narrator only says the background glow is not wanted and sets the widths to 0).
5. Brighten the first sweep's edge as the logo arrives: stopwatch on Edge Intensity of CC Light Sweep, 90 at 5:02 and a higher value at 5:20. (said "add a keyframe for the intensity... increase it up something like that, it's completely up to you")
   - Edge Intensity key at 5:02: 90.0 (shown)
   - Edge Intensity key at 5:20: 217.0 read while it was being dragged; 215.0 holds after the key. Use 215 (shown).
6. Add the hot highlight spot with Sweep Intensity on the first CC Light Sweep. The author first shows it by dragging the value (up to 16, and 21 read on a later pass; a bright rim and spot appear on the logo, "don't overdo it"), then sets it back to 0 and keys it. (said; the on-screen text of that stretch reads 16.00 and, once, 21.0, but no frame was checked for them, so treat both as unverified)
   - Sweep Intensity stopwatch on at 5:02 with 0.0 (shown reads 0.0 at 5:02)
   - Sweep Intensity key at 5:26: 18.0 (shown reads 18.0 at 5:26, field landed, not mid-drag). Said: "increase it a little bit... maybe not this much".
   - Sweep Intensity key at 6:22: 0.0 (said "set this back to 0"; shown reads 0.0 at 6:22)
   - Result with these keys: a white flare over the top of the shape, peaking around 5:20–5:26 (Sweep Intensity key 18.0 shown at 5:26; played picture).
   - What makes the flare a blob and not a brighter rim (inferred from the stack order and the frames): CC Light Sweep 1 is above the four Glows in the stack (shown), so the Glows act on its output. Sweep 1 at the flare moment reads Center 960.0, 540.0, Shape Sharp, Light Reception Add, Light Color white, Edge Thickness 4.00, Direction held at 2x+24.0° after its 5:02 key (shown, 6:22), Width 240 (key at 5:20, shown), Edge Intensity 215 (shown). The panels in the preview frames are frozen at comp time 0:00:00:00 and read Direction 0x+14.0°, Width 0.0, Sweep Intensity 0.0, Edge Intensity 90.0, Opacity 0.0 %, so they are not a source for these values; they show only Center 960.0, 540.0, Shape Sharp, Edge Thickness 4.00, Light Color white, Light Reception Add. The Sweep Intensity light is a wide bright band across the top of the logo; Glow (Threshold 24 %, Intensity 1.3, Radius 50, 165, 480, 1000, from 03-stacked-glow-on-outline) blooms every pixel above its threshold, so the band becomes a soft white blob with a long falloff. Raising Sweep Intensity without the Glows below it gives only the lit band (the viewer, 49/255 on the body, is the outline stage; is the bloomed stage).
   - What keeps the flare to one spot (shown, comp time 5:26, flare moment, effect panel read directly): CC Light Sweep 1 reads Center 960.0, 540.0 (the layer's centre, never moved, no key), Direction 2x+24.0° (held from its 5:02 key; the 0-second key is the same sweep from the earlier technique), Shape Sharp, Width 193.5 (falling from the 240 key at 5:20 towards 0 at 6:22, so about 195 by straight-line reckoning), Sweep Intensity 18.0, Edge Intensity 215.0, Edge Thickness 4.00, Light Reception Add, Light Color white. So at the flare the lit band is only about 193.5 px wide in a 1920 × 1080 comp. The effect runs before the layer's Scale, where the logo is about 560 px tall (280 px in the 960 × 540 picture, doubled), so the band is about a third (35 %) of the logo's height and lies tilted 24° from the sweep's start axis, through the logo's centre. The light shows as one blob over the upper part of the mark (centre of the blob about 11 % of picture height above the picture centre), with no second band lower down. A build that lights both ends has too wide a band or the wrong angle: keep Width near 35 % of the logo's height at the flare key (not 240 held for the whole clip, since it is already falling) and keep Direction at 24° (not 0° or 90°); check the viewer at 5:20–5:26 shows one spot over the top. The other two sweeps read Width 23.2 at that moment and Direction 2x+0.0° and add nothing to the flare. (inferred that Direction/Width/Center are what confine it; values shown)
   - The soft haze (measured on kept preview frames; right of the logo, 135–216 px out from the logo's edge in the 960 × 540 picture, i.e. 0.25–0.4 of the short side): luminance about 0.9, up to 9 and 8 on the side an arc is lit, 2.8 and 16 (flare), then 0 once the outline is gone (on). The haze is the four Glows (Threshold 24 %, Intensity 1.3, Radius 50, 165, 480, 1000) acting on whatever is lit above their threshold: the more outline is lit and the brighter (Width up to 240 and Edge Intensity up to 215 across 5:02–5:20, then the Sweep Intensity band), the wider and stronger the haze; with a thin 4 px outline, bright long arcs give a stronger bloom than short ones (inferred; the lead's ring test: 50 % at 20 px, 31 % at 40 px, 19 % at 80 px out). The author does not change the Glows here (shown against : no Glow keys). The haze is therefore not a step; a build that gets 0 beside the logo needs lit outline arcs (Width and Edge Intensity keys as given) and the Glow threshold at 03's value, not raised. (measured; the reason is inferred)
   - Check before keying the flare: scrub to about 4:07 (played): the four Glows already bloom the thin outline into a soft haze with the sweeps' Width keys in place. If that haze is missing, fix the Glows first; the flare is the same bloom acting on a much brighter, wider sweep band.
7. Final scale-down on the layer: select the layer, press S to reveal Scale (the narrator says "press U" to show the keys, which is how the stopwatch rows were shown), stopwatch on. (said "add a scale... in the beginning leave it" and "lower it down a little bit, not much"; the S shortcut is inferred)
   - Scale key at 0 s: 100, 100 % (shown)
   - Scale key at 5:02: 75.7, 75.7 % (shown reads 75.7; shows 88.2 while still being dragged, not used)
8. Preview (RAM preview) from the start to check the move: outline fragments, bloom, flare, fill fades in, haze and outline fall away, logo ends clean and smaller. (shown)

layout:
- Picture: the comp is 1920 × 1080; the viewer shows the picture at 960 × 540 px in the 1920-wide frame at x 720–1680, y 116–656 (measured on the layer's orange corner handles, : 719–1679 and 117–656). Percentages below are of that picture; for a 9:16 build keep the logo against the frame's short side (the 16:9 height here).
- Logo at 100 % scale: about 227 px wide and 280 px tall in the 960 × 540 picture, so 23.6 % of the picture width and 51.9 % of its height (measured). Centred, its centre at the picture centre (comp anchor and sweep centre are 960, 540, shown).
- Logo at the end (scale 75.7 %): 170 px wide and 209 px tall in the picture, so 17.7 % of the width and 38.7 % of the height (measured : bright pixels x 1113–1283, y 281–490 in the 1920 frame; the picture's own x 720–1680, y 116–656). Centre at 1198, 385.5 against the picture centre 1200, 386, so the scale holds about the centre. Ratio 170/227 = 0.75, 209/280 = 0.75, which agrees with 75.7 %.
- Ground: true black. The corners of the picture read 0.8/255 on every kept preview frame and the picture's minimum is 0 (measured), so the ground under the glow is black, with no tint. Far from the logo (corners) nothing is lit even at the flare.
- End state: plain white logo, black ground (measured corners 0), no halo, no outline, no shadow. Brightness mean over the picture 11.3/255 of which the logo is nearly all.
- Peak flare (measured, picture px 960 × 540 from x 720, y 116): the brightest blob (≥ 250/255) spans x 417–559 and y 162–314, so about 14.8 % of the picture width and 28 % of its height, centred about 2 % right of the picture centre and 11 % above it, which is over the top of the shape near the stem. Above 200/255 it spans 407–572 × 152–319. Halo along the row through the centre, going to the right: 100 px 162, 200 px 52, 300 px 15, 400 px 2, 470 px 0 (luminance 0–255). It is soft and neutral white; with the flare the picture mean is 32.5/255 against 11 at the end.
- The logo body at the flare reads 129/255 and 156/255 (measured on a 50 × 80 px patch of the lower body, 1160–1240 × 420–470 of the frame; 49/255 just before, 224, 245). This grey is mostly the sweep's lit band and the Glows' bloom on the logo, not the CC Composite fill: at that moment Opacity is only 0–25 % (0 % key at 5:18, 100 % at 6:22, so the fill's share is about 0–25 % across 5:18–5:26 with linear keys; the viewer readout is 5:17 and the red playhead sits near 5:20–5:21, where linear Opacity is only about 0–6 %; the viewer lags the panels), which can add at most about 60/255. A build should reach about 130–155/255 on the body at the flare, with the fill's own contribution small, and be solid white (about 245) by 6:17–6:22. Peak area ≥ 250/255 was 5404 px and 5139 (about 1.0 % of the picture) and falls to 2005, 337, 66, 6 px (kept frames are about 10 source-video frames apart; that is recording spacing, not a speed — the keys give the speed): the blob has gone by the time the fill is at about 80 %.
- Coloured fragments: before the flare, the fragments of outline are white, pink-purple and orange, caused by the sweep colours and angles from 02-multi-colour-edge-lines-converging, not set here. They run along the logo's own edges, a different arc each (the right-hand crescent last). Colours are a wide-gamut recording, take as hue only.
- The picture's top-left to bottom-right: ground has a slightly lighter patch near the logo from the Glow radius 1000 haze (see 03-stacked-glow-on-outline, radii 50, 165, 480, 1000 on a 1920 × 1080 comp with a logo about 52 % of the picture height).
- Which objects carry the effect: one layer. Every sweep, glow and the composite act on that one logo. No second layer.
- The finished example at the very start of the video (0:00–0:28, e.g.) is a different, pre-made project: a white wordmark with a swoosh, the same kind of build: pink, orange and white outline blooms, a white-hot swell, a solid white logo with a fading halo and then plain white on black. In that picture the logo is about 29.6 % of the picture width (x 675–1244 of 1920) and 27.4 % of its height (y 392–688 of 1080) at the end. It is a different shape and a different size, with a longer reveal than the build; do not read its size as this tutorial's scale value. It is a reference for the beat, not for the values.
- The tutorial also plays the saved stack on the same silhouette logo at 0:57–1:05 (motion, settles): the same look as the preview here, in a different panel layout.

timing and easing: (comp 30 fps; times written seconds:frames as the comp's time display shows them)
- Opacity check (shown): at 5:26 the panel reads 23.5 %, which a straight line from 0 % at 5:18 (frame 168) to 100 % at 6:22 (frame 202) gives exactly (8/34), so the 5:18 key is confirmed.
- Opacity: 0 % at 5:18 (key read on the ruler at x 1090, 168 frames by the ruler's 1.84 px per frame between the 5:02 and 6:22 keys; ± 1 frame), 100 % at 6:22 (34 frames, 1.1 s). Across the flare (5:18–5:26) the fade is therefore about 0–25 % up if linear (inferred); it is about 0–6 %. The first positions, 5:02 and 6:06, were slid later (shown vs).
- CC Light Sweep Width: 79 at 5:02, 240 at 5:20, 0 at 6:22 (shown).
- CC Light Sweep 2 and 3 Width: 79 at 5:02, 0 at 6:06 (shown).
- CC Light Sweep Edge Intensity: 90 at 5:02, 215 at 5:20, held after (shown).
- CC Light Sweep Sweep Intensity: 0 at 5:02, 18 at 5:26, 0 at 6:22 (shown).
- Scale: 100 % at 0, 75.7 % at 5:02, held afterwards (shown). This means the logo drifts slowly smaller over the first 5 s, so the final size is reached just as the outline and flare begin. The preview shows it hold at its end size from 6:22 on.
- All key icons for these properties are plain diamonds in the timeline, so linear is inferred; no ease is said or shown for them. The Direction keys on the three sweeps (earlier technique) carry eases; not touched here.
- The preview runs from the comp start; the time display stays frozen at 0:00:00:00 while it plays. The viewer picture changes between the kept frames, so it plays. Speed: take it from the keys above, not the recording (the playback is about real time, since the clean logo arrives about 6.7 s after the black first frame, matching 6:22, but this is inferred).

variations: The author says the values are "up to you" for the opacity and intensity keys, and that the second opacity key may be moved later for a delayed fill. The author also says Sweep Intensity "don't overdo it". The first demonstration showed a bright rim from Sweep Intensity at ~16–21; the author kept 18 as the key peak. (said)
pitfalls: The sweep Width must be 0 by the end or the outline glow stays behind the solid logo (said, in other words: zero width removes the glow). Don't push Sweep Intensity too far (said).
build notes:
- Effect properties as After Effects shows them: CC Composite has Opacity, Composite Original (In front / Behind) and RGB Only. CC Light Sweep has Center, Direction, Shape, Width, Sweep Intensity, Edge Intensity, Edge Thickness, Light Color, Light Reception. (match names not given; look up)
- Add CC Composite last in the stack (below the glows). Set the keys in the table above, by script: Opacity at 5:18 = 0 and 6:22 = 100; sweep 1 Width at 5:02 = 79, 5:20 = 240, 6:22 = 0; sweeps 2 and 3 Width 79 at 5:02, 0 at 6:06; Edge Intensity 90 at 5:02, 215 at 5:20; Sweep Intensity 0, 18, 0 at 5:02, 5:26, 6:22; Scale 100 at 0, 75.7 at 5:02. Frame numbers in a 30 fps comp: 5:02 = frame 152, 5:18 = 168, 5:20 = 170, 5:26 = 176, 6:06 = 186, 6:22 = 202.
- Hand work: nothing special; the author slid keys with the mouse. Pixel-valued effects are scaled for a 1920 × 1080 comp with a logo about 52 % of the picture's height; scale Glow radii with the logo size in other comps.
unknowns: Whether Composite Original and RGB Only were left at their defaults or changed (only the values are shown). Whether the logo's Fill colour was white or pure white at the end (the end logo reads 255). The first two earlier keys on the sweeps (0 s and about 1:17) come from earlier techniques. The Scale key's ease. How long the preview takes in real time on the author's machine (the 7 s of recording matches the comp's 6:22 but is not measured against the display). Clean still of the end state: (same crop 720,116,960,540, no handles or mouse, holds at least); the frames carry orange layer handles and must not be used.

## Swap the logo or text inside a finished glow-reveal setup
id: 06-swap-logo-or-text-procedurally
revision: 220eebe5
job: introduce-tool; support: light-the-hero
status: proven (accepted 2026-11-26)
what it does for a beat: When a glowing outline-and-flash logo reveal is already built on a pre-composed logo, this reuses it for another mark or a word. Replace the artwork inside the pre-comp and the whole animation carries over unchanged.
what it looks like: A white mark (first a swoosh-and-lettering logo, then the word HELLO in a heavy geometric sans) is traced by a thin pink/orange/white glowing outline, floods briefly to a soft white bloom, and settles as a crisp white shape on black, centred.
ingredients:
- Pre-composed logo layer in the main comp, already carrying the reveal stack: Fill, three CC Light Sweep, four Glow, CC Composite — stock; Effect menu (stack shown). Built in earlier recipes of this video (ids in layout); not rebuilt here.
- Fill — stock; Effect > Generate > Fill (found in Effects & Presets under Generate)
- New artwork: a dark logo image on transparency (3840×2160 px file), or a Text layer — built-in
steps:
1. In the main comp, open the pre-comp that holds the logo (its tab sits beside the main comp's tab). Starting state: one layer, the old logo, with a Fill effect (white swatch, opacity 100 %) and its eye box already blank, so the viewer is black. (shown; the old layer is therefore hidden, not deleted, and the author does not touch its eye in this technique)
2. Drag the new logo image (dark artwork on transparency, 3840×2160 px, shown in the Project panel) from the Project panel into the pre-comp, above the old layer. (said "drag it over here"; shown, new layer 1)
3. Scale the new layer down. (said "scale this down")
   - Scale: 100 % at first (shown, only hairline edges visible), 21.1 % while dragging (shown), landed at 21.0 % linked (shown).
   - The image is 3840 px wide in a 1920 px comp, so 21 % puts the mark at about 804 comp px wide, about 41 % of the pre-comp's picture width (measured : 397 of 960 px). The size is the author's choice (inferred); this is the figure to aim at in the pre-comp. The main comp then shows it smaller, see layout.
4. Add Fill to the new layer: search "fil" in Effects & Presets, apply Fill from the Generate group (said "apply fill effect"; search and result shown; applying by double-click or drag is inferred). The dark image is invisible on black until this is done (shown).
   - Color: white, FFFFFF (shown, colour dialog open; viewer shows the mark solid white). The author spends the longest here, see longest on.
   - Fill Mask None, Opacity 100 % (shown).
5. Go to the start of the main comp and play a preview (said "press play"; that it is a RAM preview is inferred from the comp's time display staying at 0:00:00:00 while the viewer's readout advances). Every move of the reveal now runs on the new shape. (shown)
6. For text instead, in the same pre-comp (shown):
   - Text tool active, a new text layer reading HELLO (typed text shown; the typing itself is not on a kept frame), layer 1, above the image layer (shown).
   - Character panel: Montserrat, Black, 185 px, leading 131 px, tracking 0, white fill (shown, HELLO layer selected). An earlier read of 100 px was a different selection.
   - Centre it: Align panel, Align Layers to: Composition, click the vertical-centre button (shown, cursor on it); horizontal centring is inferred, since the word sits centred (measured).
   - The image layer (layer 2) keeps Scale 21.0 % and an empty eye box, and so does the old logo (layer 3) (shown). Whether the image layer's eye was switched off by the author is not shown on a kept frame.
   - Play the main comp again (shown).
layout: Viewer picture = 960×540 px at x 719, y 116 in the 1920×1080 frame (the whole 16:9 comp, calibrated on the picture's borders). Two views exist and differ in size.
- Pre-comp viewer (where the author works): mark 397 of 960 px = 41 % of the width; HELLO 323 of 960 px = 33.6 % of the width (cap height about 65 viewer px, about 130 comp px at 185 px type). Measured.
- Main comp (the result): mark 300 × about 155–160 px of 960 × 540 = 31 % of the width, 29 % of the height; HELLO 243 × 51 px = 25.3 % of the width, 9.4 % of the height (cap height). Both centred within 0.5 % of the picture centre. Measured. The ratio main ÷ pre-comp is about 0.75 both times (0.31/0.41, 0.253/0.336). It comes from the pre-comp layer's own scale-down key, 100 % to 75.7 % over 5 s 02 (recipe 05-fill-reveal-with-composite-and-highlight, step 7; held from then on). So to reach the result sizes either size the artwork in the pre-comp at the pre-comp figures and keep that key, or size it at the main-comp figures and leave the key out. Do not do both.
- 9:16 build: HELLO about 25 % of the frame width at rest, mark about 31 % of the frame width at rest (main-comp view). In 16:9 the HELLO is 45 % of the picture height wide.
- Reveal stack on the pre-comp layer in the main comp (shown): Fill, three CC Light Sweep, four Glow, CC Composite. Figures needed here, from earlier recipes: Glow 1–4 each Threshold 24 %, Intensity 1.3, radii 50 / 165 / 480 / 1000 (03-stacked-glow-on-outline); CC Light Sweep Width keys 0 → 79 → 240 and direction keys over 5 s 02 (02-multi-colour-edge-lines-converging, 04-animated-light-sweep-width-reveal); CC Composite fade of the solid, Edge Intensity 90 → 215, Sweep Intensity 0 → 18 → 0 (05-fill-reveal-with-composite-and-highlight). Without that stack the new artwork is only a white shape.
- Look at the result: thin pink / orange / white outline slivers glow round the shape, swell to a soft white bloom about twice the mark's height peaking at about comp 5:24 (viewer readout), then settle by about 6:16 to a crisp flat white shape on black, no shadow, no outline at rest. A faint pink haze shows only while glowing. Direction of the first outline contact is not confirmed: played frames at comp 2:21 and 2:29 show the swoosh's left tip lit while only the right half of the lettering is lit, and the sweep seems to loop inside the preview.
- Which object carries the effect: the whole pre-comp layer, so the mark and the word get the same stack, one object each.
timing and easing: Comp is 30 fps; the timeline display stays at 0:00:00:00 during the preview, so times here are the viewer's own readout. Logo preview : readout 2:29, 3:27, 4:18, 5:24 (white bloom peak), 6:16 (settled), 7:29. Word preview : 0:09, 1:15, 2:17, 3:21, 5:19, 6:21. The reveal settles at about 6 s comp time for both. Keys and eases were built earlier (see recipes above); none is changed here. The recording's playback speed is not known.
variations: Any logo image works (said "whatever logo you have"); text works too (said). Nothing else given.
pitfalls: At 100 % the image is far too large and shows only hairline edges (shown). A dark image on black is invisible until Fill is applied (shown). The narrator names no other warnings.
build notes: In the pre-comp, add the new footage layer, set Scale, add Fill (ADBE Fill) Color white. For text: `comp.layers.addText("HELLO")`, font Montserrat Black, size 185 px, white fill, then centre it in the comp (anchor and position, or Align). Leave the old layer where it is, with its eye off. Keep the main comp's reveal stack and its 100 → 75.7 % scale key as is; compare on the main-comp view.
unknowns: Colour of the main comp layer's own first Fill (not part of this technique, left unchanged; see recipe 02); text tracking beyond 0 as shown; how the text was typed; whether the image layer's eye was switched off by the author; the preview's real playback speed; the menu path to Fill (taken from the search result).

Report: second result window (word reveal) start=619.7 end=626.2 animated crop=719,116,960,540 frame=: the reveal plays is the settled clean frame (end layout only).

## Counter driven by one slider on a control null
id: 01-value-driven-counter
revision: bec7b246
job: land-number
status: proven (accepted 2026-11-21)
what it does for a beat: A stat that counts up (or down) to a figure, so a number lands with weight. The same slider later drives a ring (02-ring-fills-to-value) and bars (03-bars-grow-to-values), so one keyframed value moves the number and its graphic together.
what it looks like: A large heavy white number on a flat near-black ground counts from 0% to 83% in whole steps, sitting left of centre beside a heading and a short paragraph.
ingredients:
- Null Object — built-in; Layer > New > Null Object (inferred: the menu is not on screen)
- Slider Control — built-in; Effect > Expression Controls > Slider Control (said "expression controls"; menu not on screen, path inferred)
- Text layer with an expression on Source Text — built-in
steps:
1. Make a text layer and type any placeholder word; it will be replaced by the number (said; shown, a white placeholder word left of centre)
   - Paragraph: left-aligned (shown by the picture: the number's left edge holds at 22.4–22.6 % of the width for "2%", "14%" and "83%", cuts at 92.2, and it grows to the right as digits are added)
   - Font: Montserrat, Black style, 111 px, white (shown, Character panel; inferred to be the text layer's settings since the panel keeps the last text style; the measured digit height agrees, see layout)
2. Add a null object and apply a Slider Control to it (said; shown : null layer with "Slider Control", Slider 0.00)
3. Rename the Slider Control effect to a short value name with a number; we call it `Value 1` (said; shown with the video's own name being typed)
4. On the text layer, Alt-click the Source Text stopwatch to add an expression (said "alt click"), then drag the expression pick whip onto the null's Slider (said "pick whip"; the word "parent" in the narration means this pick-whip link, not layer parenting)
   - Resulting expression: `thisComp.layer("<null name>").effect("Value 1")("Slider")` (shown, with the video's own layer and effect names)
5. Keyframe the Slider from a start figure to the end figure (said)
   - Slider at 0:00: 0 (shown, time 0:00:00:00, Slider 0.00, key at 0:00)
   - Slider at 3:00: 83 (shown, time 0:00:03:00, Slider 83.00)
   - Interpolation: linear (shown : diamond key icons; confirmed by value: 64.56 at 2:08, which is exactly 83 × 56/72)
6. Wrap the expression in `Math.round( …)` so the text shows whole numbers instead of a long decimal (said; before: shows the long decimal; after: shown)
   - Expression: `Math.round(thisComp.layer("<null name>").effect("Value 1")("Slider"))` (shown)
7. Optional prefix: put a quoted symbol and `+` at the start of the expression (said; shown with `"$" + Math.round(…)`)
8. Optional suffix: add `+` and a quoted symbol at the end (said; shown with `Math.round(…) + "%"`). The finished counter uses the suffix only: `Math.round(thisComp.layer("<null name>").effect("Value 1")("Slider")) + "%"` (shown; the prefix is gone, result frame shows "83%" with no "$")
layout: Comp 1920×1080 (shown: in the same project's bar comp a layer at Position 499.9,671.0, sits at 26.1 % and 62.1 % of the picture; the 83.6 % viewer picture measures 2567×1444 screen px, a 1.6 display scale). Measured on the result frame (picture crop 531,193,2567,1444): the text is left-aligned with its left edge fixed at about 22.4 % of the picture width at every value; the finished "83%" spans 22.6–35.0 % (centre about 28.8 %), "2%" spans 22.4–31.2 % and 46.2–53.7 % of the height (digit height 7.5 % of the picture height, centred on the middle line) — measured. Digits pure white; ground flat RGB about 26,26,32 corner to corner, no vignette or grain (measured). The condensed all-caps heading (about 49.9–67.7 % of the width, 39.4–47.4 % of the height, pale blue-white) and the three-line paragraph below it are already in the example comp before the tip starts and are not built here; in the preview they type on during the count. They are dressing from the finished example only. Motion: only the value changes; the left edge stays put and the figure extends rightward as digits are added; no move or scale.
timing and easing: Slider keys 0 at 0:00 and 83 at 3:00, linear (shown). Comp time base 23.976 fps (shown, timecode sub-label). Do not time the count against the recording: the preview plays near real time but not exactly.
variations: Count down instead of up by keying a high start and a low end (said). Prefix or suffix symbol of choice (said; "$" and "%" shown).
pitfalls: Without rounding the source text shows the slider's full decimal, e.g. 49.5694444… (said; shown).
build notes: Null: `comp.layers.addNull()`. Effect: match name `ADBE Slider Control`, its value property `ADBE Slider Control-0001` (displayed "Slider"); set the effect's `name` to `Value 1`. Text: `layer.property("ADBE Text Properties").property("ADBE Text Document").expression = 'Math.round(thisComp.layer("Controls").effect("Value 1")("Slider")) + "%"'` (use the null's actual name). Keys with `setValueAtTime(0,0)` and `setValueAtTime(3.003,83)` (3:00 at 23.976 fps), linear interpolation. Nothing here needs the interface.
unknowns: The text layer's anchor and position in pixels (left edge at about 431 px of 1920 from the measured share); comp duration; colour of the ground as typed (only rendered colour measured); whether the heading's type-on is keyframes or a preset.

## Ring that fills to the counter's value
id: 02-ring-fills-to-value
revision: 05485478
job: land-number; support: show-proof, keep-it-alive
status: proven (accepted 2026-11-21)
what it does for a beat: A percentage stat shown as a donut that draws on to the same figure the number counts to, so the graphic and the number can never disagree. Builds on 01-value-driven-counter: it reuses that recipe's null and slider.
what it looks like: A thick yellow arc grows clockwise from twelve o'clock over a dim full ring until it covers 83 % of the circle, with the white counter centred in the ring's hole; with the optional wiggle the arc and the number keep drifting a few percent after they land.
ingredients:
- Everything from 01-value-driven-counter (null with a Slider Control renamed `Value 1`, keyed 0 → 83, and the counter text) — built-in
- Shape layer drawn with the Ellipse tool — built-in
- Trim Paths — built-in; shape layer Contents > Add > Trim Paths (said "add trim paths"; the Add menu is not seen landing, path inferred)
- wiggle() expression on the slider (optional) — built-in
steps:
1. Start from the 01 set-up: null with the value slider and the rounded counter text with a "%" suffix (said "the slider control that we created in our first technique"; shown : the null's slider and the text's `Math.round(…) + "%"` expression)
2. Draw a circle with the Ellipse tool on a new shape layer (said "any shape"; shown, Ellipse tool active, layer contents "Ellipse 1")
3. Turn the fill off, turn the stroke on, and make the stroke thick (said)
   - Fill: none (shown, toolbar Fill swatch struck through)
   - Stroke width: 100 px (shown, toolbar "100 px"; the narrator passes through other numbers while dragging, 100 is where it lands)
   - Line cap: left at the default Butt Cap (inferred: at 0 % the arc shows as a thin straight sliver, not a round dot)
4. Colour this ring a little lighter than the ground; it is the dim track (said "brighter or darker color than our background")
   - Stroke colour: #2A2733 (R42 G39 B51) (shown, Stroke Color dialog with Preview on; the ring in the viewer already shows the dim colour)
5. Nudge the counter about 19 px left so the landed "83%" centres in the ring, at the same height (not said; the move is not shown being made; measured: its left edge sits at 21.6 % of the width against 22.6 % in 01, and the landed "83%" centre is 27.8 % against the ring centre 28.0 %, where in 01 it was 28.8 %; shows the number in the ring's hole)
6. Duplicate the ring layer and give the copy the main colour (said)
   - Stroke colour of the copy: #FFC200 (R255 G194 B0) (shown, Stroke Color dialog; the copy is the upper layer)
   - Stacking: yellow copy on top, dim track under it, then the null and the counter text (shown)
7. Open the yellow copy's contents and add Trim Paths (said; shown, "Trim Paths 1" inside "Ellipse 1" with Start 0.0 %, End 100.0 %, Offset 0x+0.0°)
8. Alt-click the Trim Paths End stopwatch and pick-whip it to the 01 slider (said "parent it to the slider control"; the screen shows an expression link, not parenting)
   - End expression: `thisComp.layer("<null name>").effect("Value 1")("Slider")` (shown, with the video's own names; End reads 69.2 % while the slider reads 69.17)
   - Start 0 %, Offset 0° left as they are (shown); the arc grows clockwise from twelve o'clock (shown, result frame)
9. Optional: Alt-click the slider's own stopwatch and add a wiggle so the value keeps drifting after it lands (said; the narration's "all good stopwatch" is Alt-click)
   - Slider expression: `wiggle(2,5)` (shown; two wiggles a second, up to 5 units either way); the keyframes stay under it (shown, key icons at 0:00 and 3:00 with the expression)
layout: Measured on the result frame (picture crop 681,170,2240,1260): ring centre 28.0 % across, 49.9 % down; outer diameter 57.0 % of the picture height; band thickness 9.1 % of the picture height (= 100 px in a 1080-high comp, matching the stroke) — measured. So the ellipse path's own diameter is about 47.9 % of the height (about 515 px in the 1920×1080 comp). Counter digits 7.5 % of the picture height, same size and height as in 01, about 19 px further left (see step 5) — measured. The counter is left-aligned (see 01): only the landed "83%" looks centred in the ring (27.8 % across); every value starts at the same left edge, 21.6 % of the width ("69%" spans 21.6–34.2 %), so small values such as "1%" and "2%" sit left of the ring's centre during the count. Rendered colours: ground RGB 26,26,32; track 39,38,49 (agrees with typed #2A2733); arc 255,186,0 against the typed #FFC200 (a saturated colour from a screen recording; use the typed value). Both rings are the same size and position; the arc covers the track exactly where drawn. No shadows, glows, gradients or grain. The arc's tail stays at twelve o'clock; its head travels clockwise and stops at 83 % (about ten o'clock). The heading and paragraph to the right are the example comp's pre-existing dressing (see 01). With the wiggle on the landed value reads 80–86 % and the arc's head moves with it.
timing and easing: Slider keys at 0:00 and 3:00, end value 83 (shown landed as "83%"). By this point both keys are Easy Ease (hourglass icons, shown crop), not the linear keys of 01; the change is not shown being made. Influence 100 % in and out, speed 0, on both keys (inferred from values: that curve gives 69.12 at 1:16 and 70.86 at 1:17, the panels read 69.17, and 70.89, it gives 6.7 at 1:02 and 13.9 at 1:08, which fits the preview; default 33 % Easy Ease would give 48 at 1:16). Look: the count creeps for about a second, jumps from about 14 to 64 within about 6 comp frames mid-way, then settles slowly into 83. Wiggle: frequency 2 per second, amplitude 5 (shown).
variations: Any shape drawn with the shape tools can be used, not only a circle (said). Track colour can be lighter or darker than the ground (said). The wiggle is optional (said).
pitfalls: none given. (Inferred: the wiggle acts from frame 0, not only after the count lands, so near 0 % the number can briefly read negative and the arc's End clamps at 0.)
build notes: Shape layer: `comp.layers.addShape()`; Contents > `ADBE Vector Group` > `ADBE Vectors Group` > `ADBE Vector Shape - Ellipse` (Size [515,515], inferred), `ADBE Vector Graphic - Stroke` (Color, Stroke Width 100, Line Cap 1 = Butt), no fill. Duplicate the layer, set the copy's stroke to [1,0.761,0]; add `ADBE Vector Filter - Trim` to the copy's group and set `ADBE Vector Trim End` expression to the slider reference. AE's ellipse path starts at the top and runs clockwise, which gives the twelve-o'clock start with Offset 0. Ease both slider keys with `setTemporalEaseAtKey(k,[new KeyframeEase(0,100)],[new KeyframeEase(0,100)])` (100 % influence; a default Easy Ease is visibly softer). Wiggle: set the slider property's `expression = "wiggle(2,5)"`. Nothing needs the interface.
unknowns: Ellipse size as typed (only measured share); whether the 100 % influence was typed or came from a preset (only the curve is settled).

## Round-capped bars that grow to their own values
id: 03-bars-grow-to-values
revision: 19e03b63
job: compare; support: show-proof
status: proven (accepted 2026-11-21)
what it does for a beat: A comparison beat: several figures rise side by side, each to its own value, so the viewer reads which is biggest. Builds on 01-value-driven-counter (a null whose sliders hold the values) and 02-ring-fills-to-value (dim track under a coloured copy, Trim Paths End linked to a slider).
what it looks like: Thick yellow pill-ended bars rise from a common baseline inside dim full-height tracks of the same width, on a near-black ground with a percent scale at left, month labels below and a value above each bar. The build makes two bars (54 % and 64 %); the finished example plays twelve.
ingredients:
- Null with Slider Controls, one per bar, set up as in 01-value-driven-counter — built-in
- Shape layers drawn with the Pen tool — built-in
- Stroke Line Cap: Round Cap — built-in
- Trim Paths — built-in
steps:
1. In the chart comp, have a null with a Slider Control renamed `Value 1`, keyed from 0 to the first bar's figure, as in 01 (said "the value you've created"; shown : a null in this comp with "Value1", Slider 54.00 at 3:00, key at 0:00; the bar starts as a dot at 0, build preview)
   - Value 1: 0 at 0:00 → 54 at 3:00 (end value shown; start value inferred from the bar starting at 0 in the preview)
2. With the Pen tool, draw one straight vertical line from the baseline up to the top of the scale (said "a long, straight line"; shown, the line spans the 0 % row to the 100 % row, here already yellow). Draw it bottom first: Trim Paths End grows from the path's first point, and the bar grows upward (shown; the click order itself is inferred)
3. Set the stroke (said "round cap"; values shown)
   - Stroke Width: 35 (shown, landed; toolbar "35 px" also)
   - Line Cap: Round Cap (shown with the menu open on Round Cap; landed result shown as rounded ends)
   - Fill: none (shown, toolbar Fill struck through)
   - This first line is the dim track; colour about RGB 44,40,55 (#2C2837) (read from the Color swatch; near-grey, so little gamut error; agrees with the rendered 44,42,54)
4. Duplicate the line and give the copy the bar colour (said)
   - Stroke colour of the copy: #FFC600 (R255 G198 B0) (shown, Stroke Color dialog)
   - The copy sits above the track (inferred: Duplicate places it above, and the yellow covers the track)
5. Add Trim Paths to the yellow copy and link its End to the slider by Alt-clicking End's stopwatch and pick-whipping to `Value 1` (said "like before"; shown, pick whip dragged onto the null's Slider) — the same link as 02
   - End expression: `thisComp.layer("<null name>").effect("Value 1")("Slider")` (shown, with the video's own names, on the duplicated bar before it is re-pointed)
6. Duplicate the slider effect on the null (it keeps its keys) and change the copy's end key to the second figure (said)
   - Value 2: 64 at 3:00 (shown, Effect Controls "Value2" Slider 64.00 at 0:00:03:00; Value 1 read 54.19 earlier, and 54.00 here, so 54 is the end value)
7. Duplicate both lines (track and yellow), move the pair right to the next column, and re-point the copy's End expression at `Value 2` (said; shown : moved pair at Position 499.9,671.0, Anchor Point -573.7,131.0, i.e. about 112 px right of the first pair at about 388 px; shows the pick whip being dragged to Value2's Slider, both bars still at 54 % there)
8. Repeat for more bars, one slider per bar (said "continue to create more bar lines")
layout: Comp 1920×1080 (shown: Position 499.9,671.0 sits at 26.1 % and 62.1 % of the picture). Build (measured, picture crop 788,247,2567,1444, where both bars still read 54 % because the second link is mid-drag): bar centres at 20.2 % and 26.1 % of the picture width (spacing 5.9 % of the width); bar thickness 3.1–3.2 % of the picture height (= 35 px in a 1080-high comp); each track runs from 37.5 % to 86.7 % of the height including its round caps, so the path is about 46 % of the height long (about 497 px of 1080); yellow from 58.7 % to 86.7 % for 54 % — measured. Rendered colours: ground RGB 17,17,20 (flat); track 44,42,54; bar 255,190,0 against the typed #FFC600 (saturated colour from a screen recording; use the typed value). The scale labels (0–100 % at left), month labels under each column, the value labels above each column and the condensed heading with a two-line subtitle are already in the comp (shown) and are not built in this tip. Finished example (a different, pre-made comp, measured on the cut, viewer at 100 % showing the middle of the comp): twelve bars, first centre about 20 % and last about 82 % across, spacing about 5.6 % of the width; bars thinner, about 2.7 % of the picture height; tracks about 37 % to 85.5 % of the height; bar colour renders RGB 255,171,0, deeper than the build's; a fine animated grain over everything; values 54, 64, 47, 81, 73, 67, 59, 55, 74, 93, 82, 72 %. In the finished example the tracks also draw on from the bottom, the bars rise with a left-to-right stagger and the value labels count up with them; none of that is built in this tip. No shadows or glows in either.
timing and easing: Keys at 0:00 and 3:00 on each slider (shown); the key at 0:00 is Easy Ease (hourglass icon); the 3:00 key is hidden under the playhead. Bars in the build share one key timing because the second slider is a duplicate of the first. Finished example (read from the viewer's time display, which redraws only every few frames, so approximate): the first bar appears at about 0:00:00:23 and the last at about 0:00:01:05, so all twelve start within about 6 comp frames, left to right (roughly half a frame apart); each settles about 18–24 frames after it starts; all hold from about 0:00:02:10.
variations: Any number of bars, each with its own slider value (said).
pitfalls: none given.
build notes: Per bar, two shape layers (or two groups) each with `ADBE Vector Shape - Group` holding a two-point vertical path, bottom vertex first; `ADBE Vector Graphic - Stroke` with Stroke Width 35 and Line Cap 2 (Round). Top copy colour [1,0.776,0]; add `ADBE Vector Filter - Trim` and set `ADBE Vector Trim End` expression to `thisComp.layer("Controls").effect("Value N")("Slider")`. On the null, one `ADBE Slider Control` per bar named `Value N`, keys 0 → figure, eased. Space columns 5.6–5.9 % of the comp width apart. All of it can be scripted.
unknowns: The Easy Ease influence in this comp; the start value of the sliders (0 inferred); how the finished example's stagger, track draw-on and counting labels are made (only their timing is read).

## Icon that fills up to a value
id: 04-icon-fills-to-value
revision: b09ebf07
job: land-number; support: make-concrete
status: proven (accepted 2026-11-21)
what it does for a beat: Turns a flat icon into a gauge: a bright copy of the icon rises from the bottom over a dim copy and stops at a figure, so a stat reads as "how full". Reach for it beside a counter when a percentage needs a picture.
what it looks like: A dim slate-blue rocket icon on a near-black ground; a golden-yellow copy of the same icon fills it from the bottom edge upward with a hard horizontal edge, stopping at about 86 % of the icon's height, next to a large white figure with a small caption (the figure finishes counting before the fill starts to rise).
ingredients:
- Fill — built-in; Effect > Generate > Fill (the Effect menu with Generate highlighted is shown; the submenu item itself is inferred)
- Shape layer drawn with the Pen tool, Stroke only — built-in
- Trim Paths — built-in; shape layer Contents > Add > Trim Paths (shown)
- Slider Control on a Null Object (effect renamed "Value1") — built-in; Effect > Expression Controls > Slider Control (inferred; the menu item is visible in the Effect menu)
- Track Matte column (layer-picker style, AE 2023+) — built-in (shown)
steps:
1. Start from the value rig of 01-value-driven-counter: a Null Object carrying a Slider Control whose effect is named "Value1". In this comp a fresh Null Object with that slider sits at the top of the stack (shown; the narrator only says to link "like we've been doing"). (shown)
   - Slider keyframes: 0.00 at 0:00, a second key at 3:00 (positions measured on the timeline ruler) (shown)
   - Both keys Easy Ease (hourglass key icons) (shown)
   - Slider mid-move at 0:00:01:18: 72.33 (shown)
   - Second key's value: not readable; see unknowns
2. Bring in the icon as a flat single-colour graphic (here a vector shape layer; the narrator says a PNG or illustration works too). (said; shape layer shown)
3. Apply Fill to the icon and set a dim, desaturated colour — the bottom copy that stays visible as the "empty" part. (said; shown)
   - Color: a dark slate blue, swatch reads about RGB 39 54 65 (#273641) (shown, sampled from the swatch)
   - Opacity: 100 % (shown)
4. Duplicate the icon (Edit > Duplicate, Ctrl+D inferred) and on the copy, which sits above, set the Fill colour to the bright accent colour. (said; shown)
   - Color: #FFCD10 (H 48°, S 94 %, B 100 %; R 255 G 205 B 16) (shown)
5. Use the Pen tool (with no layer selected, inferred) to draw a straight two-point vertical path through the middle of the icon, a little longer than the icon is tall, then set a very thick stroke so the square of stroke covers the whole icon. (said; shown)
   - Stroke Width: 464 px (shown)
   - Fill: none (Fill swatch shows the red slash) (shown)
   - Stroke colour: yellow (it is only a matte, so the colour does not matter) (shown)
   - Path length about 375 comp px, from about 16 px above the icon's top to about 14 px below its bottom; stroke square about 464 x 375 px (measured: the 464 px stroke gives the scale, a punched-in shot about 1.245x larger than, mapped into the result frame through the figure's size and position; check: End 72.33 then predicts 74.8 % fill, and measures 74.5 %)
   - Path direction: the reveal grows from the bottom, so the path's first point must be the bottom one; if it grows from the top, reverse the path direction (inferred from the result)
6. Add Trim Paths to the shape layer. (said; shown)
   - Start: 0.0 %, End: 100.0 %, Offset: 0x+0.0°, Trim Multiple Shapes: Simultaneously (shown)
7. Add an expression to End (Alt-click its stopwatch, inferred) and pick-whip it to the null's Value1 Slider so End equals the slider value. (said; pick-whip being dragged shown — the finished expression is not shown)
   - Expression: thisComp.layer("Null Object").effect("Value1")("Slider") (inferred)
8. On the bright copy, set Track Matte to the stroke shape layer (alpha matte). The matte layer's eye switches off on its own. (said; shown)
   - Layer order top to bottom: Null Object, stroke shape layer (matte, hidden), bright icon copy, dim icon, counter rig layers from 01, background (shown)
   - Matte type alpha (filled-circle mode icon), invert off (empty invert box) (shown, full-size crop)
9. Play: the bright copy climbs from the bottom as the slider rises, and stops at the slider's final value. (said; shown in and again as the preview loops)
layout: Measured on the result frame at the viewer's 100 % zoom (the comp is larger than the viewer, so its edges are not in the picture; sizes are given in comp pixels with the 464 px stroke as the scale). Icon (a rocket pointing up-right) about 344 x 344 comp px (measured: 552 x 550 rec px at about 1.60 rec px per comp px), centred vertically on the figure-and-caption block to its right (inferred from the frame). Bright fill's top edge sits at 86 % of the icon's height from its bottom (measured; holds), a perfectly horizontal hard edge, no feather. The dim part above reads RGB 39 54 66 and the bright part RGB 255 197 5 in the recording (measured; the typed bright value is #FFCD10 and the dim swatch reads #273641 — recording on a wide-gamut screen can shift the yellow). Ground RGB 20 18 25 (measured), a flat solid with no shading or grain. The icon's porthole is a hole showing the ground. Next to the icon: a large heavy white figure over a lighter caption, both from 01-value-driven-counter; in the result playback the figure counts up first and finishes (126k; then 650k, 704k, 752k, 793k, 825k, 861k between; 863k) while the fill has only just started (about 2 %); they do not run together, and whether the same slider drives both is not shown. No shadows, glows or overlaps besides the bright copy over the dim one.
timing and easing: Slider keyed 0 at 0:00 to its final value at 3:00, both keys Easy Ease (shown). Comp frame rate 23.976 fps (shown). In playback the fill rises from near empty to its final level and holds; the preview readouts lag and cannot give a reliable curve.
variations: Works with any flat graphic — PNG, illustration, or a photo (said). The fill colour of either copy can be anything (shown: red tried first, then slate blue).
pitfalls: none given
build notes: All scriptable. Fill match name ADBE Fill (property "Color"); Slider Control ADBE Slider Control renamed "Value1"; on the matte shape layer: ADBE Root Vectors Group > ADBE Vector Group > ADBE Vectors Group with an ADBE Vector Shape - Group (two vertices, bottom first), ADBE Vector Graphic - Stroke (Stroke Width 464) and ADBE Vector Filter - Trim with End's expression set to the slider. Duplicate with layer.duplicate(); set the matte with brightCopy.setTrackMatte(strokeLayer, TrackMatteType.ALPHA) (AE 2023+) or by placing the stroke layer directly above and setting trackMatteType. Size the path to the icon's height plus about 4 % margin at each end (16 px over a 344 px icon); fill share of the icon = (End x 375 - 14) / 344. To match the result, aim the final slider key at End about 83 (gives 86 %); the typed value in the video is unknown.
unknowns: The second slider key's typed value: not readable on any frame; build to the measured 86 % fill (End about 83). The 72.33 readout at 1:18 does not fit a default Easy Ease from 0 to about 83 at 3:00 (that would read about 52), so the readout or the key times may differ from what the ruler suggests; do not derive the final value from it. The exact expression text; the comp's size; whether the counter figure is driven by the same slider; the dim Fill colour's typed value (only its swatch is visible). The rise plays and again (preview loop); the result window above is the held end state (fill 86 %, checked at 269.1, 269.2).

## Map regions that fade up one by one
id: 05-map-regions-fade-up
revision: 59a59810
job: point-at-detail; support: establish-place, list-items
status: proven (accepted 2026-11-21)
what it does for a beat: Marks places on a map: chosen regions light up in colour over a grey base map, each with a numbered list entry, so a viewer reads "these places" in order. Use it for coverage, rankings or "where" beats.
what it looks like: A pale grey map of a continent on an off-white ground, with a numbered list down the left third. Six regions, each a different saturated colour (amber, orange, coral red, navy, sky blue, light cyan) with its name in white, fade up one after another over the grey map, each together with its matching numbered entry.
ingredients:
- A vector map with each region as its own shape — outside After Effects (stock vector art in the tutorial)
- Adobe Illustrator, Layers panel — outside After Effects; used to split regions into their own top-level layers (shown)
- Opacity keyframes — built-in
steps:
1. Get a vector map of the area. (said)
2. In Illustrator, move each region you want to animate out of the map's group into its own top-level layer; the rest of the map stays together on one base layer. (said; shown — new top-level layers above the base map layer, whose sublayers are the individual countries)
3. Save as an Illustrator file. (said; the File menu's Save is named on screen near, not checked)
4. Import into After Effects as a composition so each Illustrator layer becomes its own layer. (said; the import dialog is not shown, so the exact import type is inferred: "Composition – Retain Layer Sizes" or "Composition")
   - Resulting comp: 1920 x 1080, 23.976 fps, 0:00:10:00 (shown)
   - Layers top to bottom, all imported Illustrator layers: Layer 8 (the numbered list art, inferred from the picture), Ukraine, Finland, Spain, Italy, Germany, United Kingdom, Europe map (shown)
   - Region layers carry region names (renaming is not shown or said; inferred)
5. Select the region layers, open Opacity (T, inferred) and key a fade from 0 % to full. All selected layers get the same keys at the same times. (said; shown)
   - Opacity: 0 % at 0:00 (shown)
   - Second key at about 0:00:01:01 (measured from key position on the ruler) (shown)
   - Second key value: 100 % (inferred; Opacity read 100 % before keying)
   - The base map and the list layer are not faded (shown : list and grey map stay visible at 0 %)
6. The finished example (a separate, pre-made comp, not the build) staggers the regions: each region and its numbered entry appear in turn, by staggered layer in-points with a short fade. (shown)
   - In-points of five layers in the finished example: about 0.50, 1.05, 1.50, 2.00 and 2.69 s; one more is present from 0:00 (measured from the layer bars)
   - Order of appearance: amber region and 01 first, then orange (02), coral (03), navy (04), sky blue (05), light cyan (06) (shown)
   - The last region is half faded at 0:00:03:01 and full at 0:00:03:07, so each fade lasts roughly 0.3–0.6 s (measured from readouts; inferred)
layout: Measured on the result frame, comp 1920 x 1080 (picture edges found at the viewer's comp border). Ground off-white RGB 251 251 251, flat (measured). Base map light grey RGB 210–221 (regions differ slightly), with small dark grey country labels; it spans about 35–98 % of the width and 2–97 % of the height (measured). Numbered list in the left third: six rows, circles about 4.5 % of the width (8 % of the height) across, centred about 10 % from the left, rows about 15.7 % of the height apart starting at about 11 % from the top (measured); each row a coloured title and two grey lines of placeholder text, circle and title in the region's colour. Region colours in the recording: amber RGB 255 175 7, orange 255 125 0, coral 236 88 83, navy 0 75 127, sky blue 42 166 228, light cyan 90 197 218 (measured; saturated colours may read stronger than the render on a wide-gamut recording). Each coloured region carries its name in white caps; the grey regions' names are dark. Example sizes: the amber region spans roughly 71–87 % of the width and 48–66 % of the height; the orange one 38–52 % and 70–90 % (inferred from the frame). No shadows, strokes or depth; the coloured regions simply cover their grey counterparts. The finished example's stack is a Noise adjustment layer with effects on top, a separate Names layer, six region layers (Layer 2–7), a graphics precomp and the map art (shown); the ground in the result crop is flat 251 (no visible grain), so the noise adds nothing a builder needs. In the build the list (top Illustrator layer) does not fade; in the finished example each list row fades with its region, which means the list is split per row there.
timing and easing: Build: all regions fade 0 → 100 % over about 1 s from 0:00, linear keys (shown; ease not shown). Finished example: staggered in-points about 0.5 s apart, short fades (see step 6).
variations: Each region's layer can be animated "any way" — the opacity fade is the simplest (said).
pitfalls: none given
build notes: The After Effects part is only an opacity fade per layer and fully scriptable: layer.opacity.setValueAtTime(t, 0) / setValueAtTime(t + 0.5, 100), offset per region (or set layer.inPoint). The region separation is an Illustrator step a script cannot follow, and we do not need it: our route is generated map art delivered as separate, pre-aligned region layers — one full-frame PNG with alpha per highlighted region (the region in its colour, no label), with all region names on their own always-visible labels layer above the regions — in the finished example the white names sit on a separate Names layer and show before their regions fade in (: GERMANY and ITALY white over grey). Below the regions goes one base map with every region grey, and the numbered list comes as one layer per row so each row can fade with its region. Import each as footage, stack at the comp centre, and key the fades. If shape layers are wanted instead, an SVG/AI per region can be imported and converted with Layer > Create > Create Shapes from Vector Layer (a menu command; check how it can be called by script before relying on it).
unknowns: The exact import type; the second opacity key's value and easing in the build; how the finished example fades each region (in-point plus opacity, or keys only) and the per-region times beyond the five measured in-points; which layer holds which region in the finished example; how the list is split there. The build's own fade is never played on screen; the result shows the finished example.

## A pill button built in its own comp
id: 01-pill-button-in-own-comp
revision: 33b5d2bd
job: call-to-action; support: show-real-screen
status: proven (accepted 2026-11-21)
what it does for a beat: The call-to-action button for an end card or app demo: a flat, fully rounded pill with a centred caps label, kept in its own comp so the scene can place, scale, slide and "press" it as one layer.
what it looks like: A saturated blue pill, about four times as wide as it is tall, with half-round ends and a short two-word all-caps label in heavy white sans set with very wide letter spacing, centred in the pill. Flat: no stroke, no gradient, no shadow at this stage. The comp around it is white and leaves a wide margin on every side.
ingredients:
- Composition (Composition > New Composition; Composition Settings dialog) — built-in
- Rectangle Tool shape layer (Rectangle Path, Fill, Stroke) — built-in
- Horizontal Type Tool text layer with the Character and Paragraph panels — built-in
- Font Montserrat ExtraBold — free (Google Fonts); any heavy geometric sans stands in
steps:
1. The scene this button goes into is a square comp (shown : Project panel lists it).
   - Width × Height: 1080 × 1080 px (shown)
   - Frame Rate: 60 fps; Duration 0:00:20:30 (shown)
2. Make a new comp for the button (shown : Composition Settings dialog open over the empty scene).
   - Width: 800 px, Height: 800 px (shown crop: Height being typed as 800 with Width already 800 px; the 800 × 800 comp is listed)
   - Pixel Aspect Ratio: Square Pixels; Frame Rate: 60; Duration: 0:00:20:30; Resolution: Third (shown)
   - Background Color: White (shown). The comp's background colour does not render when the comp is nested; it only makes the white page visible while working (inferred).
3. With the Rectangle Tool, drag a rounded box roughly across the middle of the comp (shown : a rounded rectangle path with handles, Contents > Rectangle 1 > Rectangle Path 1).
   - Size at that point: 631.8, 165.9 (shown)
   - Roundness: 451.0 (shown). This is far more than half the box's height, so After Effects clamps it and the ends become full semicircles (inferred; the pill has half-round ends).
   - Rectangle Path Position: 0,0; Transform: Rectangle 1 Position 0,0, Scale 100 %, Rotation 0 (shown)
4. Turn the stroke off and the fill on (shown : Fill 1 has its eye on, Stroke 1's eye is off; toolbar Fill is a solid swatch and Stroke shows the red "none" slash; it was the reverse, a 10 px white stroke and no fill).
5. Set the fill colour in the Shape Fill Color dialog (shown : dialog open at 000000; the hue is then dragged into blue).
   - Fill Color: #0036FF (R 0, G 54, B 255; H 227°, S 100 %, B 100 %) (shown; OK pressed with the same values, scratch frame cut from the source video)
6. Type the rectangle's size exactly (shown).
   - Size: 700.0, 170.0 (shown)
7. With the Type tool, click and type a two-word all-caps label; centre the paragraph (shown : Paragraph panel with Center text selected; the first, oversized letters spill past the pill).
   - Font: Montserrat, style ExtraBold (shown crop)
   - Size: 60 px; Leading 0 px (shown crop and the cut; it does not change a single-line label); Fill colour white, no stroke (shown crop)
   - Vertical and horizontal scale 100 % (shown)
   - Tracking: 157 (shown mid-drag at 84; settled at 157 on, crops cut from the source video; the timeline's "157" reading of the tracking field is the same)
8. Move the label into the middle of the pill (shown : text Position 394.3, 424.0; then : 399.1, 421.0 with the Align panel open, "Align Layers to: Composition"). Whether the author used the Align buttons or nudged by hand is not visible (inferred: aligned to the comp's centre, since the measured label centre sits on the pill centre within a pixel).
9. Resize the comp around the button in Composition Settings (height down from 800, width up from 800), leaving a margin (shown : Height scrubbed to 531 with Width 800; the cut from shows 1034 × 531; final size).
   - Final comp size: 1040 × 530 px (shown crop of the Project panel)
   - Every layer kept its place relative to the comp's centre: the label's Position went from 399.1, 421.0 to 399.1, 286.5 (−134.5, half of 800 − 531) and then to 519.1, 286.0 (shown). So the comp was resized about its centre, After Effects' default anchor (inferred).
   - The margin left is 170 px each side and 180 px above and below the pill (inferred from the figures). The next tip's soft shadow reaches about 140 px below the pill and fits inside this margin (see layout).
layout: Measured on the result frame (comp 1040 × 530 shown at 72.4 %, calibrated on the comp's white edges, 634–1386 × 120–503 on screen). Pill: 700 × 170 comp px (measured 498–507 screen px wide), so 67.3 % of the comp's width and 32.1 % of its height, centred both ways (measured). Placed at 100 % in a 1080 square scene it is 64.8 % of the picture's width and 15.7 % of its height (inferred from the figures; recipe 03 measures exactly that). Ends: full semicircles. Label: cap height 44 comp px, 25.9 % of the pill's height (measured; consistent with 60 px Montserrat); width about 505 comp px, 72 % of the pill's width (measured, 828–1193 on screen); centred on the pill within 1 px horizontally and vertically (measured). Letter gaps are wide: tracking 157 adds 0.157 em, about 9.4 px at 60 px, to every letter gap (inferred from the setting); the gap between the two words reads about one letter wide (measured by eye). Colour as rendered in the recording: pill about (52, 42, 252), label white about (253, 253, 253). The typed value is #0036FF; the recording reads more violet, the wide-gamut display shift described in the lessons, so build with #0036FF. No stroke, no shadow, no gradient on anything at this stage.
timing and easing: none given (nothing animates in this tip).
variations: none given.
pitfalls: none given. Seen on screen: the first comp is far too big, so the button is resized after the label is set (step 9), and the label's position shifts with each resize because After Effects keeps layers centred.
build notes: Comp: app.project.items.addComp(name, 1040, 530, 1, 20.5, 60) (white bgColor only for viewing). Shape layer: comp.layers.addShape(); Contents add "ADBE Vector Group" > "ADBE Vector Shape - Rect" with "ADBE Vector Rect Size" [700,170] and "ADBE Vector Rect Roundness" 451 (any value of 85 or more gives full round ends); add "ADBE Vector Graphic - Fill" with "ADBE Vector Fill Color" [0, 54/255, 1]; no stroke group. Layer at the comp's centre [520, 265]. Text: comp.layers.addText("…"), TextDocument font "Montserrat-ExtraBold" (PostScript name; check app.fonts or substitute a heavy geometric sans and match cap height 44 px), fontSize 60, fillColor [1,1,1], applyFill true, applyStroke false, tracking 157, justification ParagraphJustification.CENTER_JUSTIFY; then centre the layer on the pill by its sourceRectAtTime bounds (the author's Position was 519.1, 286.0 with the anchor at the baseline). Building straight at 1040 × 530 skips steps 2 and 9 and gives the same picture.
unknowns: The shape layer's own Transform (layer Position, Anchor Point) is never opened; the pill is measured centred. Whether the label was centred with the Align panel or dragged. The reason for a 1040 × 530 comp rather than one cropped tight to the pill is not stated (the margin is inferred to be room for the shadow of recipe 02). Whether the hue was typed or dragged to #0036FF (it was dragged through 0048FF first).

## Headline, button and web address stacked on a white square
id: 03-end-card-stack
revision: 33ec8bcf
job: call-to-action; support: reveal-headline
status: proven (accepted 2026-11-21)
what it does for a beat: The closing card of a social ad or product promo: one line of headline, one button and a quiet web address, on a clean white square, centred on one vertical axis and ready to be animated in.
what it looks like: A white 1:1 frame. Near the top, a short three-word headline in sentence case, medium-heavy blue sans. In the middle, a blue pill button with a white spaced-out caps label and a soft blue haze beneath it. Near the bottom, a small, widely spaced web address in pale blue (the same blue at 40 %). Everything is centred left to right; the web address sits well below the button, so the stack is not evenly spaced.
ingredients:
- Rectangle Tool shape layer as the background — built-in
- The button comp of recipes 01 and 02, nested (figures repeated below so this recipe stands alone)
- Horizontal Type Tool text layers, Character panel, Align panel — built-in
- Font Montserrat (ExtraBold and SemiBold) — free (Google Fonts)
steps:
1. The scene comp: 1080 × 1080 px, 60 fps, duration 0:00:20:30, white background colour (shown in the Project panel; white background set in its dialog, timeline "Background Color: Light Gray → White" at 0:28).
2. Draw a rectangle in the scene comp and make it fill the frame (shown : a rectangle drawn; : Size being typed; : it fills the comp).
   - Rectangle Path Size: 1080.0, 1080.0 (shown)
   - Rectangle Path Position 0, 0; Roundness 0.0 (shown)
   - Transform: Rectangle 1 Position typed back to 0, 0 (shown being edited; centred)
   - The group also carries a white 10 px Stroke 1 set to "Below Previous in Same Group" (shown); it sits on the frame's edge and changes nothing visible.
3. Rename the layer as the background (shown) and set its fill to white with the toolbar's Fill swatch (shown : Shape Fill Color dialog at 0036FF; : FFFFFF being typed; : the square is white).
   - Fill Color: #FFFFFF (shown)
   - Why a white shape over a white comp background: the comp's background colour does not render when the comp is nested or rendered with alpha, the shape does (inferred).
4. Drag the button comp from the Project panel into the scene, above the background (shown : the button sits in the middle of the square; at 100 % zoom).
   - Button comp (recipes 01 and 02, shown there): 1040 × 530 px; a 700 × 170 pill with full half-round ends, Fill #0036FF, no stroke, centred; label Montserrat ExtraBold 60 px, white, tracking 157, centred; the pill carries Drop Shadow #0036FF, Opacity 50 %, Direction 180°, Distance 48, Softness 248; the label carries Drop Shadow black 40 %, 180°, 4, 0 and a second Drop Shadow #FFFFFF 24 %, 0°, 9, 52.
   - Layer Position and Scale are never opened; it lands at the comp's centre, and the measured pill is 700 px wide and centred, so Scale 100 % and Position 540, 540 (inferred, measured).
5. Add the web address: Type tool, click in the lower part of the frame and type a placeholder address (shown cursor, text).
   - Fill colour: #0036FF (shown : Text Color dialog, H 227°, R 0, G 54, B 255)
   - Font: Montserrat ExtraBold (shown)
   - Size: 40 px (shown; it started at 60 px, and was typed to 40)
   - Tracking: 160 (shown; it started at 157 and passed 80, and was typed)
   - Vertical scale 100 %, horizontal scale 99 % (shown; set by hand, where the scrub cursor is on that field)
   - Paragraph centred (inferred: carried over from the button label, shown centred; the measured address centre is on the comp's centre)
   - Position: 541.2, 959.6 (shown on the duplicate made from it before it was moved, cut from the source video; the text reader's 844.6 is a misreading)
   - Opacity: 40 % (shown; passed through 20 %)
   - Horizontal centring with the Align panel, "Align Layers to: Composition", is open (the click itself is not seen; inferred).
6. Duplicate the address layer to start the headline (shown : a second copy above; Edit > Duplicate inferred), move it to the top (shown : Position 541.2, 122.2), retype it as a three-word headline and rename it (shown).
7. Style the headline (shown : font style menu; : Bold, 98 px; : final).
   - Font: Montserrat SemiBold (shown; tried Bold)
   - Size: 98 px (shown; scrubbed to 98)
   - Tracking: 20 (shown; it was 40)
   - Fill colour: #0036FF, kept from the copy (shown swatch)
   - Opacity: 100 % (shown; it had inherited 40 %)
8. Set the headline's height by trial (shown: Position 541.2, 243.2 and 245.2 in the 5:44 window, 215.2 at 5:51, 195.7 at 5:59), ending at:
   - Position: 541.2, 255.7 (shown)
layout: Measured on the result frame (the whole 1080 square at 33.3 %, calibrated on the white frame's own edges, 830–1189 × 132–491 on screen; comp px = 3 × screen px, so figures are ± 3 px). All three elements are centred left to right on x ≈ 540 (measured). Headline: glyphs from y 180 to 255 (16.7 % to 23.6 % of the height; baseline 255.7), letters about 75 px tall from ascender to baseline (about 7 % of the height), the line about 660 px wide (210–870, 61 % of the width). Button pill: x 192–888, y 456–624, so 700 × 170 (64.8 % of the width, 15.7 % of the height), centred at 540, 540 (measured). Pill label: caps about 44 px tall (4.1 % of the height), about 505 px wide, centred in the pill. Pill shadow: straight down, the page reads about (158, 169, 249) just under the pill against (253, 253, 253), (201, 207, 253) about 55 px under, (224, 229, 254) about 80 px under, and is gone about 126 px under (y ≈ 750, measured), blue-tinted (red and green drop, blue stays), with a faint halo on the sides. Web address: glyphs from y about 924 to 960 (85.6 % to 88.9 %; baseline 959.6), tall lowercase letters (b, t) about 30 px from top to baseline (2.8 %; the address is all lower case), line about 330 px wide (375–705, 30.6 % of the width), pale blue: the typed blue at 40 % over white gives about (153, 175, 255) (inferred from the settings; the 33 % view smears the thin letters so it cannot be read reliably). Spacing: headline baseline to pill top 200 px (18.5 % of the height); pill bottom to address cap top about 300 px (27.8 %); the address sits 120 px from the bottom edge and the headline top 180 px from the top edge (measured). Background: flat white (253, 253, 253 in the recording), no gradient, vignette or grain. Stacking, top to bottom in the timeline: headline, address, button comp, background (shown). The blue reads about (52, 42, 252) in the recording against the typed #0036FF; the wide-gamut shift in the lessons applies, so build with #0036FF. The pill shows a one-pixel darker rim in the recording at 33 % and 50 %; no stroke is on (recipe 01), so it is taken as the viewer's scaling, not a build trait (inferred).
timing and easing: none given (the card is still; the next tips animate it).
variations: none given. Seen on screen: the headline tried Bold and tracking 40 before SemiBold and 20, and several heights between y 195.7 and 255.7.
pitfalls: none given.
build notes: Background: comp.layers.addShape() with "ADBE Vector Shape - Rect" Size [1080,1080] and "ADBE Vector Graphic - Fill" [1,1,1] (or a 1080 × 1080 white solid; the picture is the same). Button: comp.layers.add(buttonComp) at [540,540], scale 100. Text layers: TextDocument font "Montserrat-ExtraBold" / "Montserrat-SemiBold" (check app.fonts; substitute and match the measured heights if missing), fontSize 40 / 98, tracking 160 / 20, fillColor [0, 54/255, 1], justification CENTER_JUSTIFY, horizontalScale 0.99 on the address (it carries to the headline copy too); layer Positions [541.2, 959.6] and [541.2, 255.7] with the anchor at the baseline as the Type tool makes it; address Opacity 40, headline 100. Check against the measured glyph boxes with sourceRectAtTime, since a substitute font shifts them.
unknowns: The button layer's Position and Scale are never opened (measured centred at 100 %). The Align-panel clicks are not seen. The headline's horizontal scale is shown at 99 % but may be an unintended carry-over. The address's exact rendered colour cannot be read at 33 % zoom. Why the headline was settled at 255.7 (the stack is not evenly spaced) is not given.

## Tap cursor built from two translucent discs
id: 04-tap-cursor-with-rings
revision: f0079c1a
job: point-at-detail; support: show-real-screen, call-to-action
status: proven (accepted 2026-11-21)
what it does for a beat: A stand-in for a finger or touch point in a UI demo. It is a soft, translucent touch marker that reads on a white screen without hiding the button under it.
what it looks like: A small round touch marker. It is a see-through darkening ring around a paler see-through disc. It sits over the lower-left edge of a blue pill button on a white end card, which also carries a blue headline at the top and a pale blue web address at the bottom.
ingredients:
- Shape layer, Ellipse tool — built-in; toolbar Ellipse tool
- Shape Fill (and Stroke, which ends with no visible effect) — built-in; layer Contents > Ellipse 1 > Fill 1 / Stroke 1
- Shape Fill Color dialog — built-in; opened from the toolbar Fill swatch
- Precomposition: own 200x200 comp nested into the main comp — built-in
steps:
1. Make a new comp for the cursor (shown)
   - Width x Height: 200 x 200 (shown)
   - Frame rate: 60 fps (shown)
   - Duration: 0:00:20:30 (shown)
   - Background Color: White at first (shown)
2. Change the comp background to black as a working aid so white shapes show. It does not render into the main comp (shown →)
3. Draw an ellipse shape layer with the Ellipse tool and type its size (shown)
   - Ellipse Path 1 > Size: 200,200 (shown)
   - Stroke 1 at first: white, width 10, Opacity 100 %, Composite Below Previous in Same Group, Butt Cap, Miter Join (shown). This stroke does not show in the finished cursor; see step 12.
   - Fill 1 > Color: white, Opacity 100 % (shown)
   - Fill 1 > Composite: Below Previous in Same Group; Fill Rule: Non-Zero Winding (shown)
4. Centre the ellipse in the 200x200 comp: the ellipse group's Transform Position goes to 0,0 (centred circle shown)
5. Duplicate the layer and rename both, an inner disc on top and an outer disc below (two layers shown; the duplicate command itself is inferred)
6. Give the inner layer a black fill through the toolbar Fill swatch (shown, cut from into)
7. Shrink the inner disc
   - Inner Ellipse Path 1 > Size: trials 147 and 152 (shown), settled on 142,142 (shown, cut from into)
8. Set both layers' Opacity to 20 % (shown)
9. Drag the cursor comp into the main 1080x1080 comp as the top layer. On the white card it is almost invisible (shown)
10. Recolour for a white background (shown; cut from into)
   - Outer layer Fill 1 > Color: #000000, typed into the Shape Fill Color dialog (shown)
   - Inner layer Fill 1 > Color: #FFFFFF (shown)
11. Tune the layer opacities until it reads on white (shown; cut from into)
   - Outer layer Opacity: 40 % → 30 % → final 25 % (shown)
   - Inner layer Opacity: final 40 % (shown)
12. Strokes: turn them off on both ellipses (inferred from the result). The finished cursor has no visible stroke. The ring is a flat 0.75 × ground right up to the inner disc's edge at 71 comp px. A white 10 px stroke on the 40 % inner layer would draw a light rim at radius 71–76, and none is there (measured). The inner disc also shows no halo on black.
layout: measured (cut from into), with the cursor layer at 100 % scale. Cursor: outer disc diameter about 198–200 comp px, about 18 % of the picture width (measured). Inner disc radius about 71 comp px, about 0.70 of the outer diameter (measured). The ring band between them is about 29 comp px, about 2.7 % of the width (measured). The centre sits at about comp (298, 640), about 28 % across and 59 % down (measured). That puts it half over the button's lower-left edge and half over the button's blue shadow, stacked above both. The tones follow the opacities exactly when read against the ground underneath (measured against the same region before the cursor existed). The ring is 25 % black over the ground: ring = 0.75 × ground (measured 0.71–0.76 all round; 249 gives 190, 69 gives 49). The inner disc is 40 % white over the 25 % black: disc = 0.45 × ground + 102 (measured: 202 gives 192, 178 gives 183, the blue button at 69 gives about 128). On plain white (250) that is a ring of about 188 and a disc of about 215. Both are neutral, with no tint, and the cursor casts no shadow of its own. Scene (all from technique 03, figures measured there; also visible in this result crop). The card is a flat white 1080 square, about 253 in the recording. The headline is a three-word sentence-case line in #0036FF, Montserrat SemiBold 98 px, tracking 20, centred. Its baseline is at y 255.7, glyphs y 180–255, about 61–62 % of the width wide, its centre about 20 % down. The button pill is 700 × 170 (65 % × 16 %), #0036FF, centred at (540, 540), with a white all-caps label. The pill carries Drop Shadow #0036FF, Opacity 50 %, Direction 180°, Distance 48, Softness 248 (technique 02). That makes a blue haze straight below the pill, gone about 126 px under; the cursor's lower half sits in it. The web address is a lower-case placeholder in #0036FF at layer Opacity 40 % (pale blue), Montserrat ExtraBold 40 px, tracking 160, centred. Its baseline is at y 959.6, about 31 % of the width wide, about 87 % down. Stacking, top to bottom: cursor, headline, address, button, background.
timing and easing: none given (the cursor is static in this section)
variations: none given. Shown only as trial and error: black or white fills, a range of inner sizes (147, 152, 142) and of opacities (20, 25, 30, 40 %)
pitfalls: none given in words. Shown: white discs at 20 % vanish on a white screen, so the fills are swapped (black outer, white inner) and the opacities raised; this has its own chapter at 7:30. Judge the tones against the ground under the cursor (the button and its shadow), not against open white.
build notes: Make a 200x200 comp with two shape layers, each holding one ellipse group ("ADBE Vector Group" > "ADBE Vector Shape - Ellipse" Size, "ADBE Vector Graphic - Fill"). Outer layer: Size [200,200], Fill [0,0,0], layer Opacity 25. Inner layer, above it: Size [142,142], Fill [1,1,1], layer Opacity 40. Leave out "ADBE Vector Graphic - Stroke", or set it to enabled = false. Shapes are centred at group Position [0,0]. The black comp background is only a viewing aid. Nest the comp in the main comp with layers.add(comp) as the top layer, at about (298, 640) for this still. Check the result against ring = 0.75 × ground and disc = 0.45 × ground + 102. Everything here can be done by script.
unknowns: How the strokes were removed is not shown; their absence is inferred from the picture. How the layer was duplicated (menu or shortcut) is not shown. The very first drawn size is read only from the window's text, not from a cited frame, so it is left out.

## Card elements slide in from the left, one after another
id: 05-staggered-slide-in
revision: 3e9d01cb
job: call-to-action; support: list-items
status: proven (accepted 2026-11-21)
what it does for a beat: Builds an end card or call-to-action screen in a quick, readable cascade: each element arrives from off the left edge and lands in place a few frames after the one above it, so the eye reads headline, then button, then address.
what it looks like: On a plain white square, a blue headline, a blue pill button and a small pale-blue web address each whip in from the left with motion blur, decelerate hard and settle centred; the headline lands first, the button 5 frames later, the address 10 frames after the headline.
ingredients:
- Position keyframes on three layers (two text layers and one precomp layer) — built-in
- Keyframe easing, influence 65 % out of the first key and 65 % into the second — built-in (Animation > Keyframe Velocity); in the video it is set with a third-party easing panel (two linked influence sliders), price not shown
- Drop Shadow on the pill and two on its label — built-in; Effect > Perspective > Drop Shadow
- Font Montserrat (ExtraBold, SemiBold) — free (Google Fonts)
- Motion blur (layer switch and the timeline's Enable Motion Blur button) — built-in
steps:
0. Park the tap cursor out of the picture first: at the chapter's start it sits on the button (Position 300, 642; shown); the author moves it to 1208, 980, below and right of the comp, with no keys (shown). It stays there through the entrance (technique 06 keys it later).
1. Start from the finished still layout in a 1080 x 1080, 60 fps comp on a white background: headline, button (its own precomp) and web address, all centred horizontally. (shown)
   - Headline Position: 541.2, 255.7 (shown)
   - Button Position: 540, 540 (shown)
   - Web address Position: 541.2, 959.6 (shown)
   - Web address Opacity: 40 % (shown)
2. With all three layers selected, set Position keys at their resting values and place those resting keys at frame 30 (0:00:00:30); there is a second key at frame 0. (shown)
3. Go to frame 0 and drag the X value of the three selected layers together to the left until each sits fully off the left edge. All three move by the same amount, 1063 px (98.4 % of the comp width); Y is untouched. (shown; the drag passes through values such as -401.8)
   - Headline start Position: -521.8, 255.7 (shown)
   - Web address start Position: -521.8, 959.6 (shown)
   - Button start Position: -523, 540 (shown)
4. Select all six keys and ease them: influence 65 % on the outgoing side of the first key and 65 % on the incoming side of the second, speed 0 at both. The panel's sliders read 65 and 65 (shown) and the keys turn to hourglass icons (shown). That speed is 0 is inferred, and confirmed: the shown readouts at frames 2, 5 and 27 (-520.2, -510.9, 217.2 for the headline; -322.5 and -86.7 for the address and button at frame 27) are exactly what a 0-speed, 65 % / 65 % curve over 47 frames gives. Built-in route: Animation > Keyframe Velocity, Incoming and Outgoing Influence 65 %, Speed 0 (inferred).
5. Drag the three resting keys later, from frame 30 to frame 47, so each move lasts 47 frames (0.78 s). (shown moving; landed and measured at 47 on the zoomed ruler)
6. Stagger the layers by sliding whole layer bars along the timeline (keys travel with them): the button layer starts 5 frames later, the web address layer 10 frames later; the headline stays at frame 0. (shown button at 5 f, address bar starting at 10 f, final)
   - Headline keys: frame 0 → 47 (measured)
   - Button keys: frame 5 → 52 (measured)
   - Web address keys: frame 10 → 57 (measured)
7. Motion blur is on for the three layers and for the comp (switch on in each layer row and the timeline's motion-blur button lit). It was already on before this chapter. (shown)
layout: Artwork (figures from recipes 01, 02 and 03, re-read here on their frames so this recipe stands alone): background a full-frame white shape (#FFFFFF, 1080 x 1080). Button: a precomp 1040 x 530 holding a 700 x 170 pill (Rectangle Path, Roundness 451, so full half-round ends), Fill #0036FF as typed in its dialog, no stroke, centred; placed at 540, 540, Scale 100 %. The pill carries Drop Shadow: Shadow Color #0036FF, Opacity 50 %, Direction 180° (straight down), Distance 48, Softness 248, Shadow Only off (shown). Label inside the pill: two words in caps, Montserrat ExtraBold 60 px, white, tracking 157, centred (shown); it carries Drop Shadow black, Opacity 40 %, Direction 180°, Distance 4, Softness 0, and Drop Shadow 2 #FFFFFF, Opacity 24 %, Direction 0° (up), Distance 9, Softness 52 (shown). Headline: three words in sentence case, Montserrat SemiBold 98 px, tracking 20, horizontal scale 99 %, Fill #0036FF, Opacity 100 %, centred paragraph (shown); it is a lighter weight than the ExtraBold label. Web address: Montserrat ExtraBold 40 px, tracking 160, horizontal scale 99 %, Fill #0036FF, layer Opacity 40 %, centred (shown). All text anchors sit on the baseline (Type tool default). Measured on the result frame (picture 360 x 360 px in the recording = the 1080 comp). Background plain near-white (253, 253, 253) (measured). Headline: one line of blue Montserrat SemiBold (lighter than the ExtraBold label), letters spanning y 16.7–23.6 % of the picture height (cap-to-baseline about 7 % of the height), x 18.9–80.8 % (62 % of the width), centred (measured). Button: blue pill, body y 42.5–57.8 % (15 % of the height) and x 17.8–81.9 % (64 % of the width), centred, white spaced capitals inside (measured). Build its fill as #0036FF; the recording shows about (56, 52, 255), more violet, the wide-gamut shift of the lessons. Under the pill the Drop Shadow below makes a blue haze: on the (253, 253, 253) page it reads about (158, 169, 254) just under the pill's lower edge, about (216, 219, 253) 25 px (comp 75 px) under, and fades out (about 240) by roughly 10 % of the picture height below the edge; red and green drop while blue stays near 252, so it reads as blue, not grey; a faint tint (about 245) reaches about 1 % of the height above the pill and the haze spreads a little past the pill's ends (measured; recipe 02 measures the same in the button comp). Web address: small spaced pale-blue lowercase text at 40 % opacity, y 85.8–89.4 %, 30 % of the width, centred (measured). Motion: every element travels horizontally from left to right only, starting fully outside the left edge (rest X minus 1063 px, 98.4 % of the width). Speed from the keys (the recording's preview ran at about real time: the comp's time display reads 0:00 and 57 frames, but take speed from the keys anyway): each move averages 22.6 px per comp frame (126 % of the width per second) and peaks at about 2.9 times that, about 6 % of the width per frame, near the middle of its move; at 25 % of its duration an element has covered only 7 % of the distance and at 75 % it has covered 93 %, so it whips through the middle and eases hard into place. The headline is settled at frame 47, the button at 52, the address at 57; after that all three hold still. Order on screen is top to bottom: headline, button, address (shown in the preview, cut frames). Motion blur strength (measured on the source preview, every recording frame a fresh comp frame there: the pill's edge advances about 21 px of the 360 px view per frame at peak, matching the keys' 62–65 comp px per frame, and no frame repeats): on the button's entrance (pill top row, view y 162, cut frames) the leading right edge's 10–90 % ramp reads 31–32 view px at 20–21 px of travel per frame, and the full ramp from 0.02 to 0.98 of the pill's darkness is about 40 px; a settled edge reads 5–6 px. The measured smear is a linear ramp, so a moving edge smears over about 1.8–1.9 frames of its travel (the 10–90 % ramp alone spans about 1.5 frames); at peak speed that is about 120 comp px of full ramp, about 95 comp px from 10 to 90 %, against a still edge's 12–18 comp px. Mid-flight no letter is readable: the headline and label become streaks (cut frame for the exit, for the entrance). This is about four times After Effects' default 180° blur (half a frame). Shutter: the comp's motion-blur settings (Composition Settings > Advanced, Shutter Angle and Phase) are never shown; a shutter angle of about 650–720° would give a 1.8–2 frame smear (inferred; 720° is After Effects' maximum), so start at 680° and compare the leading edge's ramp at peak speed with the figures above. Samples per frame are not shown; the ramp reads smooth.
timing and easing: 60 fps. Each element: two Position keys 47 frames apart, X only, offset -1063 px at the first key. Starts at frames 0, 5 and 10 (headline, button, address); landings at 47, 52 and 57. Influence 65 % out of the first key and 65 % into the second, speed 0 at both (65/65 shown; speed 0 inferred and matched to the readouts).
variations: none given (no narration). The author first tried a 30-frame move and then lengthened it to 47 frames (shown).
pitfalls: none given.
build notes: Motion blur: `comp.shutterAngle = 680` (range 0–720) and check the smear against layout; the default 180° gives about a quarter of the measured smear. Artwork: Drop Shadow is "ADBE Drop Shadow"; by script its Opacity is on a 0–255 scale (50 % = 127.5, 40 % = 102, 24 % = 61.2; read it back); Shadow Color [0, 54/255, 1] for the pill; the label's second instance is "Drop Shadow 2". Fonts by PostScript name "Montserrat-ExtraBold" and "Montserrat-SemiBold" (check app.fonts; substitute and match the measured glyph boxes if missing). Script: for each layer, `layer.property("ADBE Transform Group").property("ADBE Position")`; `setValueAtTime(0, [restX-1063, y])` and `setValueAtTime(47/60, [restX, y])`; then shift the button layer's `startTime` by 5/60 s and the address layer's by 10/60 s (moving the layer moves its keys, which is how the video does it), or add the offsets to the key times instead. Easing: `setTemporalEaseAtKey(k, [new KeyframeEase(0, 65)], [new KeyframeEase(0, 65)])` on both keys (Position is spatial, so one KeyframeEase per side) and `setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER)`. Motion blur: `layer.motionBlur = true` for the three layers and `comp.motionBlur = true`; the shutter angle is not shown; see the first line of these notes. Check by reading Position at frame 27: headline X should be 217.2.
unknowns: Whether the panel applies speed exactly 0 (the readouts match it to 0.1 px, so this is near certain). Motion blur shutter angle, phase and samples (never shown; the angle is inferred from the measured smear, see layout). Whether the first keys were made at frame 0 and copied or the rest keys moved from 0 to 30 (the frames show the result, not the gesture). The opening clip (0:00–0:12) shows the same comp presented on a rounded white card over a soft blue backdrop; that framing is the finished presentation, not part of this build, and its timing was not measured.

## Offset the logo and text groups a few frames behind the card
id: 04-staggered-element-offsets
revision: ff96ebf7
job: reveal-headline; support: add-impact
status: proven (accepted 2026-11-26)
variant of: 05-staggered-slide-in
differs: Shared: the stagger is made by sliding whole layer bars later in the timeline so each layer's keys travel with it, the first element staying at frame 0 (the parent's step 6: "sliding whole layer bars along the timeline (keys travel with them)", headline at frame 0; its build notes shift each layer's `startTime`). Differences: here the parts are groups, each a null plus its child layers (logo with its null, three text layers with theirs), and the card's own layers stay at 0; in the parent step 1 lists three layers (headline, button precomp, web address) and no nulls. Here the offsets are about 2 f (logo) and about 4 f (text) at 30 fps; in the parent they are 5 f (button) and 10 f (address) at 60 fps (its step 6). Here every group does a drop and settle with a bounce expression (recipe 03) and the order is card, logo, text; in the parent each layer does a left-to-right slide of two Position keys 47 frames apart with 65 % influence easing (its steps 2 to 4), with no expression listed among its ingredients. Here the offsets were read off the timeline ruler (the narrator said two to three frames); the parent's 5 and 10 are measured on the zoomed ruler (its step 6).
merge: confirmed (carried from checks/04-before-proof.md; the variant of and differs lines are unchanged)
what it does for a beat: Reach for it when several parts of one card all get the same drop-and-settle move and read as a single stiff block. Sliding the start of each part a couple of frames later makes the parts land one after another.
what it looks like: A pill-shaped grey card with a round logo at its left, a title and a subtitle line, and a small grey "NOW" label at the top right. Played, the card drops from high and small, overshoots to about 109 % of its settled width and settles; the logo follows from the card's upper-left corner a moment later, and the text arrives last, from well above the card, so the group builds in sequence.
ingredients:
- Parent nulls already carrying keys and the bounce expression (see recipes 02-null-hierarchy-for-grouped-motion and 03-expression-bounce-drop-in) — built-in
- Layer start-time shift in the timeline — built-in
steps:
1. Select the logo layer together with its own null, then drag them later in the timeline by two to three frames, so their keys start after the card's. (said; the bars after the move start about 2 f in on the ruler, shown : bar edge x=740 against 0 f at x=709 and 5 f at x=786, 15.8 px a frame)
   - Logo and logo null start: about 2 f after the card (shown, measured from the ruler)
2. Select the three text layers (title, subtitle, "NOW" label) with their text null and shift them the same way, a little further than the logo. (said "do the same for all the text layers")
   - Text layers and text null start: about 4 f after the card (shown : bar edge x=771 is 3.9 f). The narrator said two to three frames; the screen shows about 2 and about 4 for the two groups, so the screen decides.
3. Leave at frame 0 the master null at the top of the stack (all the group nulls are parented to it), the card's own null, and the card's layers: the stroke, the pill layer that carries the effect and the adjustment switch, and the depth layer. (shown and the timeline: their bars start at the ruler's 0)
4. Make sure every null in the groups (and the card's null) carries the author's bounce expression on both Position and Scale, so the drop settles with a wobble; it reads each layer's own keys, so it moves with the layer when the bar is slid. Pasted earlier in the video (narration, recipe 03), not in this stretch. (said (description) for the text; said for where it goes, and per extras.md)
   - Expression text, word for word (said (description)):
   ```
   amp = .04;
   freq = 1.8;
   decay = 3;
   n = 0;
   time_max = 3;


   if (numKeys > 0) {
       n = nearestKey(time).index;
       if (key(n).time > time) {
           n--;
       }
   }


   if (n == 0) {
       t = 0;
   } else {
       t = time - key(n).time;
   }


   if (n > 0 && t < time_max) {
       v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);
       
       // Ease Out Factor (starts at 1, gradually reduces to 0)
       easeFactor = easeOut(t, 0, time_max, 1, 0);
       
       value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t) * easeFactor;
   } else {
       value;
   }
   ```
5. Scrub the first frames and check the order: card, then logo, then text. (shown, viewer and timeline both at 3 f: card and logo in, text not yet; inferred that this is the intended read)
6. Preview the first second or so; the arrival is played as a looping preview (shown : the viewer's own time readout runs while the timeline's readout holds at 0). (shown)
layout: All figures measured on the 960×540 picture crop (crop origin 555,131 in the 1920×1080 frame; the picture is 1920×1080 comp px, so double them for comp px). Settled card (comp 13 f): width 667 px = 69.5 % of the picture width, height about 157 px = 29 % of the picture height (about 0.235 of its width), centred horizontally, centre at about 49 % of the height (266 px from the top). Logo disc: 94 px across = 0.60 of the card's height (0.14 of its width), centre 81 px (0.12 of the card width) in from the card's left edge and level with the card's centre. Title and subtitle left-aligned to the right of the disc, title about 26 px above the card's centre; "NOW" label small, grey, at the card's top right. Card light grey with a thin lighter stroke and a soft inner shade; ground near white. Not a different file: the finished example is the build the author made.
  Played arrival (redraws read from the video): the viewer redraws about once per comp frame on average (comp 1 f, readout 13 f), a loop restart at 0 f, then a hold of about 0.6 s on the start pose before the drop plays. Comp frames are skipped now and then (the scrub at 3 f shows a card at 81 % width, which no played redraw shows), so the frame labels below are good to about ±1.
  - Start pose (0 f, no logo, no text): card 405 px wide = 61 % of its settled width, centre at 145 px from the top = 27 % of the picture height, 121 px (about 240 comp px) above the settled centre. Selection boxes of the nulls show here only (a small one at the card's centre, a larger one about 100 px below it).
  - Card width then: 71 % (1 f), 91 % (about 2–3 f), 101 %, 108–109 % (peak, about 4–6 f; centre 28 px below its settled height), 104 % (about 8 f), 98 % (about 11–12 f), 100 % (about 13–14 f). Centre height follows: 27 % of the picture height at 0 f to 31 % at the peak, 48 % at the dip, 49 % settled.
  - Logo: first seen about 1 redraw after the card starts to drop, at the card's upper-left corner. Measured on the 3 f scrub (picture crop 960×540; card there is 540 px wide = 81 % of settled, top edge y 144, bottom 270, centre y 207): disc centre y 150, x 267 (57 px in from the card's left edge at x 210), 78 px across (about 80 % of its final 94 px). So against the card's CURRENT centre it sits 57 px higher and about 6 px below the card's top edge; against its SETTLED spot (centre y 266) it is about 116 px higher. This is one scrub frame, not a played redraw. It reaches the card's level about 4 redraws later and then rides with the card.
  - Text: first seen about 2 redraws after the logo, title about 136 px above the card's centre (about 110 px above its settled place), sliding down into place over about 6 redraws, level with its settled place at about 8 f; it fades or appears whole (opacity not read).
  - The logo's path is its own, not the card's: it starts at the card's top left, not on the card's centre line.
timing and easing: offsets of about 2 f (logo) and 4 f (text) after the card, at 30 fps. Eases of the underlying keys: none given. The overshoot of the card (about 109 % of settled width) comes from the bounce expression of recipe 03, not from this step.
variations: none given
pitfalls: none given
build notes: Per group, set the layer's startTime on the null and on its child layers to the card's start plus 2/30 s (logo) and 4/30 s (text). Moving the layer moves its keys, so the bounce expression (which uses its own keys) shifts with it. Do it on every layer of the group, not on the null alone, or the children's own fades will still start at 0. The start poses (card at 61 % scale, 240 comp px high; logo and text higher still) come from the earlier recipes' keys; check against the measurements above. By hand: dragging in the timeline.
unknowns: Exact comp frame of each redraw (played preview skips frames, labels ±1); the logo's and text's own start values and whether the text has an opacity key; any easing on the keys; the exact frame count of the work area (about 38 f read off the ruler). The played window holds the crop (card, logo and text all inside it, no mouse arrow, no dialog); nulls' selection boxes show only in the first two redraws, so start the compared window. is the clean settled still (comp 13 f); no kept frame is a clean mid-move frame, cut one from.

## Cursor glides in and taps the button
id: 06-cursor-travels-and-taps-button
revision: 2a41799f
job: call-to-action; support: point-at-detail, show-real-screen
status: proven (accepted 2026-11-21)
what it does for a beat: Shows a tap on a UI element. A touch marker slides in from off screen and stops on a button, and the button dips in scale and springs back, so the viewer reads "pressed".
what it looks like: A translucent grey touch marker flies in from below left, off screen, to rest on a blue pill button in the centre of a white end card, between a blue headline at the top and a pale blue web address at the bottom. The button then shrinks briefly to about 85 % and returns to full size; its lettering smears with motion blur as it does.
ingredients:
- Position keyframes on the cursor layer — built-in; layer Transform > Position
- Scale keyframes on the button layer — built-in; layer Transform > Scale
- Motion Blur layer switches and the comp's Motion Blur button — built-in; timeline Switches column and timeline top bar (already on when this section starts)
- A cursor comp: two translucent discs (technique 04; summarised in layout) — built-in
- A pill button in its own comp (technique 01) with a soft shadow (technique 02) — built-in
steps:
1. Set the cursor layer's Scale to a static 80 % and leave it unkeyed (shown)
   - Scale: 80,80 % (shown)
2. At 0:00:01:29 (frame 89) set the cursor Position off screen, below left (value typed, shown with the stopwatch still off). Then key it (keys shown)
   - Position: -106,1180 (shown)
3. At 0:00:02:07 (frame 127) key the cursor Position on the button (shown)
   - Position: 694,590 (shown)
   - Both keys linear: two diamonds at about frames 88 and 128 on the ruler (shown)
4. No further cursor keys in this section. The cursor holds on the button after frame 127 (shown)
5. Key the button layer's Scale to dip and return
   - First set at frames 153 / 163 / 173, 10 frames apart, still reading 100 % (shown)
   - Retimed to 153 / 159 / 165, 6 frames apart, the middle value being dragged at 95 (shown)
   - Frame 153: Scale 100 % (shown)
   - Frame 159: Scale 85 %, passing 95 and 90, landing at 85 (shown; 85,0,85,0 % on the key at 0:00:02:39, cut from the source video)
   - Frame 165: Scale 100 % (shown)
   - Linear keys, diamonds (shown)
layout: Measured (cut from into) and the clean frames. Cursor: two neutral translucent discs at 80 % layer scale, so about 160 comp px across, about 15 % of the picture width (inferred from technique 04's 198–200 px at 100 %). The outer disc is black at 25 % layer opacity, so the ring = 0.75 × the ground. The inner disc, about 0.70 of the diameter, is white at 40 %, so it = 0.45 × ground + 102. On plain white that is about 188 and 215 (technique 04, measured there). The cursor rests at comp (694, 590), right of centre and just below the middle, over the button's right half, stacked above everything (shown). Button: at rest about 64–65 % of the picture width and 15–16 % of its height, centred at (540, 540). It is a #0036FF pill (700 × 170) with a white all-caps label, Montserrat ExtraBold 60 px, tracking 157 (technique 01). It carries Drop Shadow #0036FF, Opacity 50 %, Direction 180°, Distance 48, Softness 248 (technique 02), a blue haze straight below, gone about 126 px under. At the deepest press its width is about 0.86 of its rest width (measured: 199 against 231 px in a 360 px view). The press smears the label's lettering with motion blur, from the switches already on. Scene (technique 03, figures measured there; visible in this result crop). The card is a flat white 1080 square, about 253 in the recording. The headline is a three-word sentence-case line in #0036FF, Montserrat SemiBold 98 px, tracking 20, centred. Its baseline is at y 255.7, about 61–62 % of the width wide, centred about 20 % down. The web address is a lower-case placeholder in #0036FF at layer Opacity 40 %, Montserrat ExtraBold 40 px, tracking 160, centred. Its baseline is at y 959.6, about 31 % of the width wide, about 87 % down. Stacking, top to bottom: cursor, headline, address, button, background (shown). Motion, from the key spacing, not a played result: the cursor travels from below left, off screen, up-right to the button. That is about 994 comp px in 38 frames (0.63 s), about 1.45 picture widths per second, constant speed, in a straight line.
timing and easing: cursor Position keys at frame 89 (-106,1180) and frame 127 (694,590), 38 frames, linear. Button Scale keys at 153 (100 %), 159 (85 %) and 165 (100 %), 12 frames in all, linear. The press starts 26 frames after the cursor lands. At 60 fps.
variations: none given. Shown only: the press spacing was first 10 frames (153/163/173), then tightened to 6 frames.
pitfalls: none given
build notes: cursorLayer.transform.scale.setValue([80,80]). cursorLayer.transform.position.setValueAtTime(89/60,[-106,1180]) and setValueAtTime(127/60,[694,590]). Then buttonLayer.transform.scale.setValueAtTime at 153/60, 159/60 and 165/60 with [100,100], [85,85] and [100,100]. Keys stay linear (KeyframeInterpolationType.LINEAR). Set layer.motionBlur = true on every layer and comp.motionBlur = true; both are lit, before this section starts. Everything here can be done by script.
unknowns: The cursor "shrink" in the technique list is not shown. Scale is a static 80 %, never keyed. The result window comes from technique 07's later preview. During the press both builds hold the cursor at (694,590), so the picture is the same. This section's own straight, linear travel is never played clean; its span shows the press only with layer handles on screen, so the travel figures come from key spacing. Motion blur shutter settings are not shown. The scale anchor is not shown, though the dip looks centred.

## Curved, eased cursor route in and out
id: 07-curved-cursor-route
revision: 79ba15a2
job: call-to-action; support: point-at-detail, show-real-screen
status: proven (accepted 2026-11-21)
what it does for a beat: Makes a touch marker move like a hand, not a robot. It arcs in, pauses on the button for the tap, then arcs out and off screen, with eased starts and stops.
what it looks like: A translucent grey touch marker streaks in from the bottom-left corner of a white end card as a long grey smear, on a shallow curve that bows slightly up and left. It settles on a centred blue pill button and holds while the button dips. Then it sweeps right and curls up and out through the right edge, blurred while it moves fast. A blue headline sits at the top and a pale blue web address at the bottom throughout.
ingredients:
- Position keyframes on the cursor layer — built-in; layer Transform > Position
- Convert Vertex Tool on the motion path — built-in; toolbar Pen tool group
- Easy Ease — built-in; Animation > Keyframe Assistant > Easy Ease (how it was applied is not seen)
- Motion Blur layer switches and the comp's Motion Blur button — built-in; timeline Switches column; shutter angle in Composition Settings > Advanced (the value is not shown, inferred 360–540°)
- A cursor comp: two translucent discs at 80 % scale (techniques 04 and 06; summarised in layout) — built-in
steps:
1. Start from technique 06's route: cursor keys at frame 89 (-106,1180) and frame 127 (694,590), linear and straight (shown)
2. First attempt: add an exit key at 0:00:03:10 (frame 190) and drag it off to the right, then pull a handle with the Convert Vertex Tool (shown)
   - Position at 3:10: dragged through 1262 → 1742,190 → 1662,190 (shown)
3. Rebuild instead: retype the 3:10 key to the button position, so frames 127 to 190 are a hold (shown)
   - Position at frame 190: 694,590 (shown)
4. Add an exit key at 0:00:04:11 (frame 251), drag it right and then up (shown)
   - Position: 1504,590 → 1474,590 → 1474,80 (shown)
5. Drag that key earlier, to 0:00:03:53 (frame 233) (shown; display reads 3:53 at 1474,80)
6. With the Convert Vertex Tool, pull the end key's (frame 233, at 1474,80) incoming handle down and left, back toward the button (shown)
   - End key in-tangent about −222, +399 comp px, about 456 px long (measured during the drag, : from viewer (991,99) to (917,232) at 33.3 %)
7. Pan the viewer up, still at 33.3 % zoom, to reach the off-screen start key (shown)
8. Pull the start key's (frame 89) outgoing handle straight up (shown)
   - Mid-drag reading: about +39, −564 comp px, from viewer (489,318) to (502,130) at 33.3 % (shown). The played route does not follow a handle that long; see layout. The value it ends at is not shown. A fit to the tracked played path gives about (136, −296) when key 2's in-tangent is (−87, 50) (inferred).
9. Marquee-select all four cursor Position keys and apply Easy Ease (selection shown; hourglass keys at about frames 90, 128, 190 and 234 on the ruler; the command itself is inferred)
10. Leave the button's Scale keys (153 / 159 / 165, 100 / 85 / 100 %) linear (shown)
11. Preview with motion blur on, at Third resolution (shown)
layout: Measured on the path frame and the preview frames (the three preview frames cut from into). Cursor: two neutral translucent discs at 80 % layer scale, about 160 comp px across, about 15 % of the picture width (inferred from technique 04). The outer disc is black at 25 %, giving a ring of 0.75 × the ground. The inner disc, about 0.70 of the diameter, is white at 40 %, giving 0.45 × ground + 102. On plain white that is about 188 and 215 (technique 04, measured). The cursor stacks above everything. Button: a #0036FF pill, 700 × 170 (about 65 % × 16 %), centred at (540, 540), with a white all-caps label, Montserrat ExtraBold 60 px, tracking 157 (technique 01). It carries Drop Shadow #0036FF, Opacity 50 %, Direction 180°, Distance 48, Softness 248 (technique 02), a blue haze straight below, gone about 126 px under. During the press the label's lettering smears with motion blur. Scene (technique 03, figures measured there; visible in this result crop throughout). The card is a flat white 1080 square, about 253 in the recording. The headline is a three-word sentence-case line in #0036FF, Montserrat SemiBold 98 px, tracking 20, centred. Its baseline is at y 255.7, about 61–62 % of the width wide, centred about 20 % down. The web address is a lower-case placeholder in #0036FF at layer Opacity 40 %, Montserrat ExtraBold 40 px, tracking 160, centred. Its baseline is at y 959.6, about 31 % of the width wide, about 87 % down. Played path, entry (measured: cursor centroids tracked on as the disc's outline, the largest blob where any RGB channel differs from the empty card by more than 12, holes filled. This catches the part over the blue button, where the inner disc lightens rather than darkens; crop 836,141,360,360, comp px = 3.01 × crop px). The entry is a shallow curve, not a deep S. It comes in through the left edge about 94–96 % down (comp y about 1020–1040). Points, comp px, as targets: (76, 961); (230, 843) at 762.07; (291, 804) at 762.10; (408, 736) at 762.12; (456, 713) at 762.15; (497, 691) at 762.17; (565, 655) at 762.18; (589, 645) at 762.22; (610, 633) at 762.23; (645, 617) at 762.27; (666, 606) at 762.30. An earlier lightness-only track read the last three of the first eight 17–34 px low; it lost the disc over the button. These corrected points agree with the checker's (499, 689), (565, 652) and (588, 641). It settles at (694, 590). The near-edge points read slightly inward because part of the disc is off screen. It bows up and left of the straight start-to-button chord by at most about 72 comp px, about 7 % of the picture, near x 70–290. The bow is 52 at x 408, 36 at x 497, 18 at x 589 and 4 at x 666. The cursor arrives heading up-right, about 28–30° above horizontal (measured from (645, 617) to (666, 606)), not level. This agrees with the proof review, which found 78 px, about 95 % down, and the same points within a few px. It disagrees with my earlier reading of the drawn path (a bow of about 17 %, crossing about 82 % down). Use the played points: the drawn path is seen at 33.3 % and its final handles are never read clean. Played path, exit (the proof build matched the reference here): from the button it runs right, almost level, for about a quarter of the picture, then turns steeply up-right to (1474, 80). It crosses the right edge about 40–42 % down. Motion blur (measured on the same tracked frames): the moving cursor is a capsule-shaped smear. Across the motion it is 161–169 comp px wide, the disc itself at 80 %. Along the motion it is 268 px at the fastest frames, so about 100–105 px longer than the disc. It is still 220–240 px (60–80 px of smear) as it slows. At its fastest the cursor travels about 70–100 comp px per frame: 205 px over the three display frames from 762.07 to 762.12, and about 98 px per frame just before. The preview drops some frames, so this is ± a frame. The smear is therefore about 1–1.4 frames of travel; at peak speed the ring is no longer visible inside it. Motion (measured from): the cursor is in the picture, a heavy motion-blur smear while fast, slowing into the button. It holds while the button dips (762.85–763.05). Then it accelerates right and up: comp x 694 → 730 → 852 → 950 → 1051, and is gone. The preview is at Third resolution, so the result looks softer than a full render.
timing and easing: cursor Position keys at frames 89 (-106,1180), 127 (694,590), 190 (694,590) and 233 (1474,80), all Easy Ease. Entry 38 frames, hold 63 frames, exit 43 frames over a chord of about 930 comp px. Button Scale keys at 153 / 159 / 165, linear. At 60 fps.
variations: none given. Shown only: the exit key first at 3:10 then rebuilt at 4:11 and moved to 3:53, and the exit end first to the right (y 590) then up (y 80).
pitfalls: none given in words. Shown: pulling a handle on an exit key with no hold before it bent the arrival too, so the route was rebuilt with a hold key (step 3).
build notes: pos.setValueAtTime for frames 89, 127, 190 and 233 (divide by 60). Curve the path with spatial tangents, pos.setSpatialTangentsAtKey(k, inTangent, outTangent). Key 1 (frame 89): out-tangent about [136,-296]. Key 2 (frame 127): in-tangent about [-87,50], about 100 px pointing back down-left so the entry arrives up-right at about 30°. Both are inferred from a fit to the eleven corrected points: RMS error 1.3 px, bow 73 px, left-edge crossing y 1031. A level [-100,0] in-tangent cannot fit them: its best fit misses by 6 px RMS and bends wrongly. Do not use the mid-drag [39,-564] or the earlier [-51,-89]. Pairs along the same family also fit within about 2.5 px, for example [-54,25] with [74,-249]. Key 3 (frame 190): out-tangent about [100,0] (inferred). The proof runner found 250 too long for both and 100 close. Key 4 (frame 233): in-tangent about [-222,399] (measured mid-drag), so the exit leg curls up into the end; the proof build's exit matched with it. Judge the result by the path, not the handle values: render the entry and check it passes within about 15 px of (230,843), (408,736), (497,691) and (589,645), crosses x 0 at y about 1020–1040 and bows no more than about 75 px from its chord. Use setSpatialContinuousAtKey(false) on keys 2 and 3 so the hold does not overshoot. Motion blur: comp.shutterAngle about 360–540 (inferred from a smear of 1–1.4 frames of travel; the 180° default gives half a frame, about a third of the reference smear, which the proof build showed). comp.shutterPhase about −180 to −270 (inferred, centred). Check that the cursor at its fastest smears about 100 px past its 160 px disc. Easy Ease is setTemporalEaseAtKey with new KeyframeEase(0, 33.33) in and out on all four keys (Easy Ease's defaults). Set layer.motionBlur = true on all layers and comp.motionBlur = true. Everything here can be scripted. Pulling handles with the Convert Vertex Tool is the interface way.
unknowns: The final start handle is not shown. The mid-drag reading (39, −564) does not match the played path, so the handle was probably released shorter or changed later. The played points are the target, and the handle is inferred from them. The hold keys' tangents are never shown; about 100 px is inferred from the proof. The end key's in-tangent is a mid-drag reading. Why the drawn path read deeper than the played one is not resolved. How Easy Ease was applied (menu or F9) is not seen, nor whether its influence differs from the default 33.33 %. Shutter angle and phase are not shown; 360–540° is inferred from the smear. The preview drops frames, so per-frame speeds are ± one frame.

## Round dots from a shape stroke
id: 01-dotted-stroke
revision: 228e87a2
job: point-at-detail; support: show-time, keep-it-alive
status: proven (accepted 2026-11-14)
what it does for a beat: Turns any stroked line or outline into an evenly spaced row or ring of round dots with no extra layers, for loaders, orbit rings, borders and decorative circles around a title.
what it looks like: A thin white ring of about thirty small round dots circles a short white word on a near-black background, and the ring slowly turns.
ingredients:
- Shape layer with a stroked path (here an ellipse) — built-in; Ellipse tool, stroke on, fill off
- Stroke > Dashes — built-in; the plus button beside "Dashes" inside the stroke
steps:
1. Draw an ellipse with the Ellipse tool on a new shape layer: white stroke, no fill. (shown)
   - Stroke Width: 18 (shown)
   - Fill: off. The toolbar fill swatch is crossed out (shown), and the group still holds a "Fill 1" with its eye switched off (shown). A scripted build must remove or disable that fill so it does not show.
   - Color: white (shown)
2. Open Contents > Ellipse 1 > Stroke 1 and click the plus button beside Dashes twice. (said; shown, after both clicks) The first click adds only Dash and Offset (shown); the second adds Gap (shown).
   - Dash: 10.0 and Gap: 10.0 after the clicks (shown); these are just what appeared, not chosen values
   - Offset: 0.0 (shown)
3. Set Line Cap to Round Cap. (said; shown, the menu open; set)
4. Set Dash to 0. With a round cap, a dash of zero length draws as a dot as wide as the stroke. (said; shown)
   - Dash: 0.0 (said; shown)
5. Raise Gap until the dots are as far apart as you want. (said; shown)
   - Gap: 67.0 in the example, with an 18 px stroke (shown). With the ring at the layout's size a proof build got only 25 dots from Gap 67 and needed about 60.5, the path's length divided by 28, for the layout's 28 dots; work the gap out from your own ring (inferred: found in a proof build, not said or shown)
6. A finishing touch, not part of the spoken trick: the finished ring turns on layer Rotation keyframes, one at 0 s and another around 3 s. (shown only; the end value is not shown)
   - Rotation at first key: 0x+0.0° (shown)
layout: dot ring: 28 dots, outer diameter 0.29 of the comp's width and 0.52 of its height (a true circle), centre at 0.50 across, 0.51 down; each dot about 0.009 of the width across; dot centres about 0.033 of the width apart along the ring; word inside: about 0.085 of the width wide, cap height about 0.048 of the height, centred at 0.50, 0.50 (all measured on a still of the result, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: The finished example turns through layer Rotation keyframes: 0° at 0:00 and a second key at about 3 s (the timeline marker sits near 03:06f in a 23.976 fps comp, shown). The end angle and ease are not given.
variations: The narrator says it works on any line or stroke, straight or a shape outline (said). The gap sets the spacing (said).
pitfalls: none given
build notes: By script: on the stroke group ("ADBE Vector Graphic - Stroke") set "ADBE Vector Stroke Width" to 18 and "ADBE Vector Stroke Line Cap" to 2 (Round Cap). Under "ADBE Vector Stroke Dashes" add "ADBE Vector Stroke Dash 1" (value 0) and "ADBE Vector Stroke Gap 1" (value 67); an "ADBE Vector Stroke Offset" is optional. Check these match names on the build machine before relying on them. The ellipse comes from "ADBE Vector Shape - Ellipse"; leave the fill out or switch it off. To animate, keyframe the layer's "ADBE Rotate Z". The dot count is the path length divided by the gap, so pick a gap that divides the circumference evenly or the dots will bunch where the path closes. That last point is inferred, not shown.
unknowns: The ellipse size. The ring fills roughly a fifth of the comp's width in the viewer, but no size is given. The second Rotation keyframe's value and its ease. The text and background treatment around the ring, which a separate glow layer makes and the tip does not cover. Whether an even dot count was chosen on purpose.

## Arc with a dot at each end
id: 02-line-with-end-dots
revision: 1571ddbc
job: relate-things; support: point-at-detail
status: proven (accepted 2026-11-14)
what it does for a beat: A thin line or arc with a round dot at each end, built inside one shape layer, for orbit segments, connector lines, data callouts and ring loaders.
what it looks like: Three thin white arcs, each with a small round white dot at both ends, sit evenly around a short white word on near-black. Together they nearly close a circle and they move in the finished piece.
ingredients:
- Shape layer holding the dotted ellipse from technique 01 (Dash 0, round cap) — built-in
- A second ellipse group with a plain, undashed stroke in the same shape layer — built-in; Add > Ellipse, or a copy of the group
- Trim Paths — built-in; Add > Trim Paths
- Null object as a parent for several copies — built-in
steps:
1. Start from a shape layer whose ellipse has a dotted stroke, as in technique 01. (inferred; the narration gives no values for the dot group; the values below are shown)
   - Stroke Width: 18.0 (shown)
   - Line Cap: Round Cap (shown)
   - Dash: 0.0 (shown)
2. In the same shape layer, add a second ellipse group with a solid stroke, so there is a thin line on the same path. It sits above the dotted group: "Ellipse 2" above "Ellipse 1". (said; shown)
   - Stroke Width: 3.0 (shown; the timeline shows it changed from 18)
   - Line Cap: Round Cap (shown)
   - Dashes: none, so the line is solid (shown, viewer)
   - Composite: Below Previous in Same Group (shown)
3. Add Trim Paths inside the solid line's group, from the Add menu, and shorten the line to an arc. (said; shown, menu open)
   - Start: 77.0% (shown; dragged up from 70%)
   - End: 100.0% (shown)
   - Offset: 0x+0.0° (shown)
   - Trim Multiple Shapes: Simultaneously (shown)
4. On the dotted group's stroke, drag Gap up until only two dots are left, one at each end of the arc. (said; shown) Why it works: dots fall at the start of the path and then every Gap pixels along it, so a long enough gap leaves one dot at the path start, where the trimmed arc ends, and one more where the arc begins. (inferred; fits it, with one dot at 12 o'clock and one at about 9 o'clock)
   - Gap: 1136.3 (shown, cropped from the full frame in; the screen reader caught 164.3 mid-drag)
5. The finished design repeats this on three layers, parented to one null, laid out around the centre. (shown, layer list; viewer; how they were offset is not shown)
layout: arcs: three arcs of one circle, diameter about 0.27 of the comp's width and 0.47 of its height, centre at 0.50 across, 0.50 down; each arc spans about 82° with gaps of about 32°, 44° and 38° between them, in that order going counter-clockwise from the 32° gap at the top (which lies between about 77° and 110° from the right); line about 0.002 of the width thick; end dots about 0.010 of the width across, roughly four to five times the line width; word in the middle about 0.086 of the width wide, centred at 0.50, 0.50 (all measured on a still of the result, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: none given. The finished arcs move in the result, but no keyframes are shown.
variations: The narrator says it lets you make your own line shapes quickly. The same set-up should work on any custom path, not only ellipses (said).
pitfalls: none given
build notes: By script: in one shape layer, make two groups on the same ellipse ("ADBE Vector Shape - Ellipse" with the same size). Group A, the dots: "ADBE Vector Graphic - Stroke" with width 18, Line Cap 2 (Round), and under "ADBE Vector Stroke Dashes" a "ADBE Vector Stroke Dash 1" of 0 and a "ADBE Vector Stroke Gap 1". Group B, the line: stroke width 3, Line Cap 2, no dashes, plus "ADBE Vector Filter - Trim" inside the group with "ADBE Vector Trim Start" 77 and "ADBE Vector Trim End" 100. Work out the gap rather than eyeballing it (inferred). The second dot must land where the trimmed arc begins, so Gap = (Start% / 100) × the ellipse's circumference: for a circle of diameter d, Gap ≈ 0.77 × π × d. Work it out from the real ellipse size in your build. Do not copy 1136.3: that value implies a circle about 470 px across, but the circle in the viewer measures roughly 400 comp px (63.3% zoom), so the layer may be scaled or the path may differ. Treat the diameter as unknown. Check the path direction too: an After Effects ellipse starts at the top and runs clockwise, so 77–100% is the arc from just above 9 o'clock to 12 o'clock (inferred, consistent). Check the match names on the build machine.
unknowns: The ellipse size (the inferred 470 px does not match the roughly 400 px measured on screen). How the second group was made (a new ellipse or a copy with the dashes removed). How the three arc layers are rotated or offset around the null, and what animates them in the result. The arc colours and glow, if any. The dash settings on the dot group beyond Dash and Gap.

## Text carousel from rotated copies around one pivot
id: 04-carousel-by-rotation
revision: 3a03f5d0
job: list-items; support: reveal-headline
status: proven (accepted 2026-11-14)
what it does for a beat: Builds a wheel of repeated words (or any layer) curving around an off-screen pivot. Use it for list reveals, title wheels and "rolodex" type moments without expressions or plugins.
what it looks like: A stack of short bold phrases in pale mint on a near-black background, fanned out along an arc that bulges to the right of frame. Each phrase is a copy of one text layer turned a few degrees further than the one above it, so the words follow the curve of a large ring whose centre sits far to the left of the words.
ingredients:
- Text layer (or any 2D layer) — built-in
- Pan Behind (Anchor Point) tool — built-in; toolbar (shown, tool highlighted)
- Duplicate layer (Edit > Duplicate, Ctrl/Cmd+D) — built-in (duplicating is said; the command used is inferred)
- Ctrl+Alt (Windows) / Cmd+Option (macOS) drag on a property value with several layers selected — built-in; spreads the change across the selected layers in layer order (said)
steps:
1. Start with one text layer, e.g. a two-word phrase set in a bold sans, light mint on a dark background (shown).
   - Font: a bold geometric sans; the Character panel shows Plus Jakarta Sans Bold (shown)
   - Rotation: 0x+0.0° (shown)
2. Move the layer's anchor point to the spot that should be the centre of the wheel — here well to the left of the words, at about the same height (said; shown — anchor crosshair sits roughly a third of the frame width left of the text). With the Pan Behind tool the text stays in place while the anchor moves (inferred from the tool shown and text not moving).
3. Duplicate the layer as many times as you want items in the wheel (said). In the example there are 55 copies, numbered up to 55 in their names (shown).
4. Show Rotation on every copy and select all the copies (shown, every layer has Rotation twirled open; pressing R with all layers selected is inferred, the keystroke is not shown).
5. Hold Ctrl+Alt (Cmd+Option) and drag the Rotation value of the top selected layer. The top layer stays at 0° and each layer below gets a further equal step, so the copies fan out around the anchor (said; shown).
   - Rotation step while dragging: about −7.8° (shown), then −6.3° (shown); it settles at −6.5° per layer (shown : 0, −6.5, −13.1, −19.6, −26.1, −32.7, −39.2, −45.8, −52.3, −58.8)
   - Direction: negative values, so each lower layer is turned further counter-clockwise (shown)
6. Adjust the drag until the gap between neighbouring copies looks even; the top copy stays at 0°, so 55 copies make 54 steps, and at about 6.53° the ring spans roughly 353°, close to a full turn (inferred).
layout: word wheel: words stacked on the right half, their left ends from about 0.50 to 0.57 of the comp's width, bowing furthest right at the middle word, which is level (centred 0.50 down); the left ends follow an arc of radius about 0.48 of the width (0.85 of the height) whose hub sits inside the comp at about 0.09 across, 0.50 down (fitted from the row spacing, which grows from about 0.11 of the height at 0.63 across to about 0.145 at 0.80 across with the 6.5° step); about ten words show at once, about 0.10 of the height apart at their left ends, tilting more the further they sit from the middle (about 20° at the top and bottom edges); middle word about 0.32 of the width wide, cap height about 0.066 of the height; title block on the left from 0.04 to 0.49 of the width, centred 0.49 down (all measured on a still of the result, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: none given for the build. The finished example rotates the wheel so words scroll past (shown, words move between frames); the copies there are parented to a null (shown, Parent column), but how that null is animated is not shown.
variations: The same Ctrl+Alt (Cmd+Option) drag also offsets layers in time (said; see recipe 05). In the finished example each copy carries a different word and a small index number (shown), not the same phrase.
pitfalls: none given
build notes: By script: set `layer.transform.anchorPoint` to the pivot in layer space (and compensate `position` so the text does not move), duplicate with `layer.duplicate()` N−1 times, then for the i-th layer from the top set `transform.rotation` = −i × step (step ≈ 6.5°, or 360 / N for a closed ring). The Ctrl/Cmd+Alt proportional drag itself is an interface gesture and cannot be scripted; the loop reproduces its result. To spin the carousel, parent all copies to a null placed at the pivot and keyframe the null's Rotation (inferred from the parenting shown).
unknowns: exact pivot coordinates and comp size; font size; text colour value; how the finished carousel is animated (null rotation keyframes, speed, easing); whether the comp in the build is 1920×1080 (the comp runs at 60 fps, shown).

## Graphics riding a spinning real object
id: 03-graphics-orbit-a-real-object
revision: aa669c47
job: list-items; support: keep-it-alive, make-concrete
status: proven (accepted 2026-11-16)
variant of: 04-carousel-by-rotation
differs: the same mechanism as the parent: copies of one layer, each turned a fixed step further about an anchor point moved onto a shared pivot, with the ring spun by parenting it to a rotating parent. Pivot: here the centre of a photographed round object, below the frame (about 1.21 of the picture height down); in the parent an empty point inside the frame, left of the words. Copies: here twelve at 30 degrees, each a whole card (photo in a matte plus caption) gathered under its own master layer, duplicated and turned +30 degrees one at a time; in the parent 55 copies of one text layer at -6.5 degrees, spread in one drag across all selected copies. Both make about a full turn; the step is a design choice (card width against word height). Spin: here every master is parented to the object, which turns by a time expression (time * -20); in the parent the copies are parented to a null whose animation is not shown (rotation keys inferred).
what it does for a beat: Lets a real photographed object drive the motion: a cut-out wheel (or any round object) spins, and a ring of graphic cards fanned around its centre turns with it like a carousel. Use it for a "meet the team" or product-range beat that should feel physical rather than a plain slider.
what it looks like: On a very pale blue-white background, the top half of a cut-out bicycle wheel rises from the bottom edge. Portrait photo cards with white caption tabs stand around it like spokes, each tilted so its bottom points at the hub, and the whole fan turns slowly anticlockwise with the wheel.
ingredients:
- A cut-out photo of a round object (a bicycle wheel PNG with transparency) — your own footage
- Expression on Rotation — built-in
- Shape layers, text layers and a photo layer for one card — built-in
- Parenting (pick whip / Parent & Link column) — built-in
- Pan Behind (Anchor Point) tool — built-in
- Duplicate — built-in; Edit > Duplicate (inferred, the command is not shown)
steps:
1. Comp 1920 x 1080, 23.976 fps, 15 s, with a flat pale background layer. (shown, project panel)
   - Background: very pale cyan-white, about RGB 236–239, 238–250, 242–251 (measured on a frame cut from source)
2. Place the wheel photo so that only its upper half shows: its hub sits below the bottom of the frame, centred left to right. (shown)
   - Anchor Point on the hub: 3157.7, 2236.2 in the photo's own pixels (shown; this value belongs to that image, so put the anchor on your own object's centre)
   - Position: 974.0, 1316.5; Scale: 37.0 % (shown)
3. Spin the wheel with an expression on Rotation: Alt/Option-click the stopwatch and type `time*-20`. (said; expression shown)
   - This turns it 20° per second, anticlockwise on screen (negative). (inferred from the expression and shown on the result: the valve stem moves about 28° in 1.45 s, top moving left, see layout)
4. Build one card upright, centred above the wheel: a portrait photo on top and a white caption tab below it holding two lines of dark text (a bold name and a lighter role) with a short rule above them. Make the white tab the master and parent every other part of the card to it. (said "parent everything to one master graphic"; shown, all parts parented to the tab)
   - Card parts as shown: the photo, a hidden shape used as its matte (eye off), two text layers, a short line shape, one more shape, and the white tab as master (shown)
5. With the master selected, take the Pan Behind (Anchor Point) tool and drag the master's anchor point down onto the wheel's hub. (said "move the anchor point ... to the center of the rotation"; tool highlighted and anchor at the card centre in a frame cut from source; anchor dragged below the frame onto the hub, cut from source)
6. Select the whole card (master and its children) and duplicate it; the copy's children follow the new master. Give the new master Rotation +30°. (said "duplicate my work and offset the rotation"; shown : copy rotated 0x+30.0°, swung clockwise to the right of the first card)
7. Repeat until the cards go all the way round: 12 masters at 0°, 30°, 60° … 330°. (said "revolve around the entire wheel"; lists masters up to the twelfth; the intermediate angles are inferred from 12 x 30° = 360°)
8. Select all twelve masters and parent them to the wheel layer, so they turn at exactly its speed. (said; Parent & Link column shows the wheel for every master)
layout: Measured on a frame cut from source (picture 1560 x 876 px in the full frame, x 826–2386, y 324–1200). Shares are of the picture height H unless marked W.
- Wheel: hub at 0.51 W across and 1.21 H down (below the frame; the shown Position 974, 1316.5 gives 0.507 W, 1.219 H). Outer tyre radius about 0.62 H, so about the top 0.41 H of the wheel shows above the bottom edge. Tyre black, rim silver, thin spokes, one dark valve stem on the rim (measured with a circle fit to the tyre's top edge).
- Cards: about 0.30–0.34 H wide and about 0.40 H tall. The photo takes the top 70 % of the card, with one rounded corner (top right, from its matte); the white tab takes the bottom 30 %. Behind each card a faint paler panel shows, offset up and to the left, and it cuts across the photo's top-left corner. It is roughly the card's size, offset about 0.02–0.03 H, and reads as white at roughly half opacity (estimated by eye). It most likely comes from the card's extra shape layer, the one stacked above the short line (inferred). Card centres sit about 0.89 H from the hub, and the inner (tab) edge about 0.68 H from it, which leaves a gap of about 0.06 H above the tyre (0.10 H in the static frame). Measured.
- 12 cards at 30° spacing. Each is rotated so its bottom faces the hub, like spokes. Five show at once along the upper arc, plus at some angles a sixth cut off at a lower corner (from a sliver to about half a card); the outer ones are cut off by the left and right edges (measured: counted on frames cut at 123.10,: 6, 5 and 6 pieces, the sixth always a corner piece).
- No shadows, no overlap between cards, flat background. In the build every card holds the same photo and caption.
- Motion: the wheel and cards turn together anticlockwise on screen (the valve stem and the cards move left across the top between). 20° per second gives a card speed of about 0.31 H per second at the card centres. Nothing else moves.
- The opening clip of this chapter is a different, pre-made comp: five or more cards, each with a different person and name, on the same kind of wheel. There the cards are parented through a null rather than to the wheel, and the soft drop shadows come from technique 05. It also turns anticlockwise.
timing and easing: Constant speed from the expression (−20° per second, linear); no keyframes.
variations: Any set of graphics can ride any real object that turns; the motion of the object motivates the graphics. (said)
pitfalls: none given
build notes: Wheel: set `rotation.expression = "time*-20"`, anchor point on the hub (for a centred PNG, `[w/2, h/2]` of the source if the wheel is centred in it), position [974, 1316.5] in a 1920 x 1080 comp, scaled so that the tyre radius is about 0.62 x 1080 ≈ 670 px. Card: make the white tab a shape layer and parent the other parts to it. Set the tab's anchor so that it lands on the hub (anchor = hub's comp position converted into the tab's layer space; with an unrotated, unscaled tab at position P and anchor A, set anchor = A + (hub − P) and position = hub). Duplicate the group 11 times by script (`layer.duplicate()` for the master and each child, then re-parent each child copy to its new master) and set the masters' rotation to 30·i. Parent the masters to the wheel last: setting `.parent` by script keeps their look at the current time, so do it at time 0, where the expression gives 0°, to keep the layer values clean.
unknowns: The card's own sizes in pixels, its fonts, the photo matte's corner radius, the pale backing panel's size and opacity (read here only from the picture). The rotation values of copies 3–12 (inferred 60°…330°). Whether the master's tab or the photo is centred on the radius. What the adjustment-style layer at the top of the stack does, and what effects the wheel layer and the background carry (fx switches on; no shadow or grade is visible in the result). The mouse pointer is inside the picture throughout the result window, so no fully clean frame exists; it sits just left of the top card's caption tab.

## Chained copies of a swinging card, placed with a helper null
id: 04-duplicate-cards-round-the-pivot
revision: fafb7596
job: list-items; support: keep-it-alive
status: unproven
variant of: 04-carousel-by-rotation
differs: the same mechanism as the parent: copies of one layer, each turned one fixed step further about a single shared pivot, so they fan out round a wheel (parent steps 2–5, the source video.md L168–L173), with the copies of the finished wheel parented to a null (L176; that the wheel is spun by keying that null is inferred, L180). What is copied: here a whole card set (matte shape, photo, headline, tags, boxes, logo: eight layers), each copy's children still parented to its own copied matte (step 1); in the parent one text layer, 55 copies (L169). Pivot: here the anchor of the null the card hangs on, inherited from 02 (ingredients); in the parent each copy's own anchor point, moved to a spot well to the left of the words at about the same height, the text staying put (the Pan Behind tool is inferred there) (L168); the hub sits at about 0.09 across, 0.50 down, inside the title block's 0.04–0.49 (layout, L175). Step: here 34°, one swing step, set by duplicating the pivot null, deleting its keys and expression, rotating that static copy to +34°, parenting the copied matte to it and then re-parenting the matte to the looping null, which folds the step into the matte's own rotation (+57° on its first key) (steps 2–6); in the parent −6.5° per layer, spread over all the selected copies in one Ctrl+Alt (Cmd+Option) drag on Rotation (L171–L172). Count: here six cards, a count inferred from the layer numbering (step 8); 55 in the parent (L169). Motion: here every copy rides the main null's looping step rotation from 02, and the copy's Scale and Rotation keys from 03 are slid later so its tilt-and-shrink fires as it reaches the top: one full cycle (24 f) for the first copy, shown, and k × 24 f for copy k in the build notes, the other copies' offsets not shown (steps 7–8, build notes); in the parent the finished wheel turns, words scrolling past, and its copies are parented to a null, but how the wheel is animated is not shown (L176, L183; that the null carries the turn is inferred, L180), and nothing is offset in time. Media: here each copy's photo is replaced by dragging an image from the Project panel onto its media layer, then rescaled (31–36 %) to fill the card (steps 9–10); in the parent the finished example gives each copy a different word and a small index number (L177).
what it does for a beat: Turns one looping swing card into a carousel of several cards that follow each other round the same pivot, one swing step apart, so a new card always arrives as the previous one leaves. Reach for it for product, photo or profile carousels where each beat shows the next item.
what it looks like: A cream background with one upright rounded photo card (a woman in a cap over a red text panel with a two-word headline and two pill tags) held in the centre, while smaller copies lean in from the lower right and fall away to the lower left on the same arc; after the media swap the copies carry different photos.
ingredients:
- The swinging card from 01-rounded-shape-matte-media-card, 02-pivot-null-swing-loop and 03-tilt-and-shrink-on-swing (matte card with its media, text and graphics parented to it; matte parented to a pivot null whose Rotation is keyed 0 f +34°, 17 f 0°, 24 f 0° with loopOut("offset"); matte Scale/Rotation keyed 0, 17, 24, 41 f)
- Duplicate (Edit > Duplicate) — built-in; menu path or shortcut not shown (inferred)
- A second null object used only as a placement helper — built-in
- Parent & Link column — built-in (shown)
- Replace layer source by dragging an image from the Project panel onto a selected layer — built-in; modifier key not shown (inferred)
steps:
1. Select every layer of the card (matte, media, logo, headline, tags and boxes) and duplicate them, so a second card set exists whose children are parented to the copied matte (said "duplicate all four elements"; shown : copies named with a "2", children parented to the copied matte, copied matte still parented to the main null)
   - The narration says four elements; the screen shows eight card layers duplicated (logo, two tag texts, two boxes, headline, image, matte). Screen wins.
   - The copied set lands directly above its source set in the layer stack (shown in a, Matte-2's set at layers 3–10 above Matte-1's set at 11–18); each later copy goes above the one before, so Matte-6's set ends up at the top (shown). This order decides the overlaps: a later card is drawn in front of an earlier one (see `layout`). Keep it when building
2. Duplicate the main pivot null once (said; shown : a second null at the top of the stack, still carrying the rotation keys)
3. On the duplicated null, delete the Rotation expression and keyframes so it is static (said; shown : stopwatch off, Rotation 0x-0.0°)
4. Parent the copied matte to the duplicated null (said; shown : copied matte's parent reads the second null)
5. Rotate the duplicated null by the same angle as one swing step of the main null, so the copy moves one step round the arc (said "the same amount" as the initial rotation; shown)
   - Rotation: 0x+34.0° (shown; the drag passes +35° and settles at +34°)
   - With Null 1 at 0° the copy now leans in from the lower right while the original stands upright (shown)
6. Re-parent the copied matte to the main (looping) null (said; shown : copied matte's parent reads the first null). The helper null is left in the comp, unparented and unused (shown)
   - After re-parenting, the copied matte's first Rotation key reads 0x+57.0° (shown) — the original +23° lean from 03 plus the helper's +34° folded in by the parenting (inferred sum)
7. Slide all of the copied matte's Scale and Rotation keyframes later in time so its tilt-and-shrink fires when the copy reaches the top, one cycle after the original (said "offset" the keys; the narration says position and rotation, the screen shows Scale and Rotation being dragged — screen wins; shows the keys while the drag is still going, tooltip visible; landed positions shown in a)
   - Offset: about 24 f (one full cycle of the null) — first key moved from 0 f to 1:00 (24 f at 23.976 fps); keys now at about 24, 41, 48 and 65 f (measured on the ruler in the cut; is mid-drag)
8. Repeat steps 1–7 to add more cards until the arc is filled (said "continue the process"; shown : mattes numbered 4, 5 and 6 in the visible part of the stack, each parented to the main null, children of each parented to their own matte; also lists a matte numbered 3; six cards in all inferred from the numbering, no frame lists all six at once)
   - Per-copy helper rotations and key offsets for cards 3–6 are not shown
9. To change a card's photo, select its media layer in the timeline and drag a new image from the Project panel onto it so the layer keeps its parent and matte (said; shown : media layer selected while an image is dragged from the Project panel; : the media layers now show different image files with the same parents)
10. Resize and reposition the new image to fill the card (said; shown)
   - Scale on the swapped images: 31.0%, 35.0%, 36.0% (shown; each value depends on the source image size)
layout: background the flat cream solid of 01 (RGB about 247,244,237); cards flat with no shadow, as in 01. At the result frame two cards show: the first card (the original) nearly upright in the centre, about 29% of the picture width and 67% of the picture height, top edge about 17% and bottom edge about 85% down (measured on a still of the result; it is still finishing its rise, upright), and the first copy at the lower right, its centre about 78% across and 78% down, at 68% scale and leaning about +57° (position measured; scale and lean from 03 and step 6; its left edge rises at about 33° from horizontal, which agrees). The left slot is empty at that moment because no card comes before the first one; it fills from the second step on: the cards are still mid-step (the first copy tilted and rising towards the centre, the original still travelling to the lower left, a third card entering at the lower right), and they have settled: the original at the lower left, partly cut by the bottom edge, the first copy upright in the centre, the third card at the lower right (cuts at 213.3,:, each cropped 626,289,1308,736). Stacking: each later card is drawn in front of the one before it, so the incoming card at the right covers the centre card's lower-right corner, and the outgoing card at the left sits behind the centre card, whose lower-left corner covers its upper-right corner (shown in those cuts; it follows from the layer order in step 1). Each card carries its own photo after the media swap (steps 9–10): the centre card a woman in a green cap, the incoming one a man in a dark jacket, the next a woman in a beige cap. Motion: right to left; the cards hold through the null's 7-frame key hold (comp frames 17–24 of each 24-frame cycle), which reads as about 12–15 still comp frames because of the long eases either side, then all step together one slot to the left, each card's centre moving about 27% of the picture width, almost all of it in about 5 comp frames, about frames 29–33 of the second cycle (in the recording, where the preview runs at about real time), peaking at about 1.5 picture widths per second (as measured for 02); a card grows to full size and stands upright as it reaches the centre and shrinks and leans outward as it leaves (03)
timing and easing: 23.976 fps; main null keys 0 f +34°, 17 f 0°, 24 f 0° with loopOut("offset") (from 02); each copy's matte Scale/Rotation keys shifted later by one 24-frame cycle per step (shown for the first copy only); eases as set in 02 and 03
variations: swap in any picture or video per card (said); "continue the process" for as many cards as wanted (said)
pitfalls: none given
build notes: by script — duplicate the card layers with layer.duplicate() (re-point each child's parent to the new matte; AE does this when the matte and its children are duplicated together). Easiest equivalent of the helper-null trick: for copy k, set its matte parent to the main null and add k×34° to every Rotation keyframe value of the copied matte (ADBE Rotate Z), then shift every Scale and Rotation key by k×24 frames (k×24/23.976 s) — read each key's time/value, removeKey, setValueAtTime at the new time, re-apply ease. Or reproduce literally: addNull(), set its anchor/position equal to the main null's, Rotation = k×34, matte.parent = helper, then matte.parent = mainNull (AE folds the helper rotation into the matte's transform). Media swap: mediaLayer.replaceSource(newFootageItem, false), then set Scale to fit. Note that keys shifted later leave the copy at its first-key state before 24 f; the video does not show a loopIn or pre-roll.
unknowns: how cards 3–6 were placed (helper rotations of 68°, 102°… or −34° are not shown) and their key offsets; whether the helper null is deleted later; the modifier key used for the media swap (Alt/Option-drag inferred); position values of the swapped images; total card count in the final comp beyond the six mattes listed; comp length. The result window is just after the span end (the playback, before the template advert) because no clean in-span frame shows the finished carousel; frame is a cut from the source video, not a kept frame.

## Soft word-by-word rise-and-fade text reveal
id: 18-smooth-text-reveal
revision: 8c8e30dd
job: reveal-headline
status: proven (accepted 2026-11-14)
what it does for a beat: Use for a headline or tagline that should arrive gently, words sliding up and fading in one after another with a smooth overlap, with no per-word keyframes.
what it looks like: A two-line bold sans headline in near-black on an off-white background; words rise a short distance and fade from grey to solid left to right, each overlapping the next (: the first three words solid, the fourth still pale and low). The fan of photo cards above, the underline under one word and the small button below are separate layers with their own animations (shown, separate layers parented to a null), not part of this technique.
ingredients:
- Text animator with Position and Opacity — built-in; text layer > Animate > Position, then Animator 1 > Add > Property > Opacity (said; shown)
- Range Selector Advanced options — built-in (shown)
steps:
1. On a text layer add a Position animator (said; shown, Animator 1 with Position)
2. Add Opacity to the same animator via its Add menu (said; shown, cursor on Add)
3. Push the animator's Position down and set its Opacity to 0% (said)
   - Position: 0.0,115.0 at first (shown), later changed to 0.0,75.0 (shown; not said)
   - Opacity: 0% (said; shown)
4. Open Range Selector 1 > Advanced and set:
   - Based On: Words (shown; not said)
   - Units: Percentage, Mode: Add, Amount: 100% (shown, left at default)
   - Shape: Ramp Up (said; shown)
   - Ease High: -50% (said "like -50"; shown)
   - Ease Low: 100% (said; shown)
   - Randomize Order: Off (shown)
   - Start 0%, End 100% left at default (shown)
5. Keyframe Range Selector Offset from -100% to 100% (said)
   - Offset: -100% at 0:00:01:05 comp time, the layer's in point (shown)
   - Offset: 100% at 0:00:03:06 (shown)
6. Play: the words rise and fade in left to right (shown mid-reveal, finished)
   - The text layer is parented to a null (shown : parent column reads "3. Null 1"); through the reveal the whole block holds still about 11.7 % of the comp's height above its final place (first word's ink top at about 43.4 % down, against 55.2 % when finished), then drops into place in about 0.4 s as the last two words arrive, slow at first, fast, then slowing into the stop; it does not drift while the earlier words reveal (measured on, in the result crop). The parent null most likely carries this move (inferred; its keyframes are not shown)
layout: crop is the whole comp at 43.5 % (comp edges at the crop edges, measured on a still of the result); finished headline: centred on 50 % across; line 1 spans 19.9-80.1 % across (60 % of the comp's width), ink 55.2-61.9 % down; line 2 spans 32.3-68.1 % across (36 %), ink 66.3-73.1 % down; line to line 11.1 % of the comp's height (measured on a still of the result); mid-reveal: a settled word's ink is about 7 % of the comp's height tall and the word still entering sits about 3.5 % of the comp's height lower and mid grey, about half the 75 px push (measured); the whole block holds about 11.7 % of the comp's height above its final place until the last two words arrive, then drops in about 0.4 s (measured on) (all shares of the whole comp)
timing and easing: Two Offset keyframes, -100% at comp frame 29 (0:00:01:05) and 100% at frame 78 (0:00:03:06) in a 23.976 fps comp, about 49 frames / 2.0 s (shown). Both keyframes are linear diamonds (shown, cropped); the softness comes from Ramp Up plus Ease High/Low, not from keyframe easing (inferred). The block's separate drop runs from about 383.2 in the source, over the last two words (measured).
variations: none given
pitfalls: none given
build notes: Text layer > Text > Animators: addProperty("ADBE Text Animator"); in its Properties add "ADBE Text Position 3D" (0,75) and "ADBE Text Opacity" (0). Range selector "ADBE Text Selector": Advanced > "Based On" = Words (3; menu order Characters 1, Characters Excluding Spaces 2, Words 3, Lines 4; from memory, verify in After Effects), "Shape" = Ramp Up (2; from memory, verify in After Effects), "Ease High" -50, "Ease Low" 100; keyframe "Offset" -100 → 100 with linear interpolation. All settable by script.
unknowns: whether Position 115 or 75 was the intended final value (75 is what the end state shows); font size and font (two different fonts appear in the character panel across frames); whether the author also changed anything on the layer's own transform; the parent null's keyframes and easing (not shown; the hold about 11.7 % high and the drop of about 0.4 s are measured, see step 6).

## Letters tumble in from just in front of the lens, one after another
id: 05-per-character-3d-fly-in-ramp-up
revision: 95094a0c
job: reveal-headline; support: add-impact
status: unproven
variant of: 18-smooth-text-reveal
differs: the same mechanism as the parent: one text animator carrying a Position offset and a second property, its Range Selector 1 Offset keyed from −100 % to 100 %, with Advanced > Shape Ramp Up and Ease Low 100 %, and Units Percentage, Mode Add, Amount 100 %, Start 0 % and End 100 % left as they are (parent steps 1–5, the source video.md L685–L700). Second property: here Rotation with Enable Per-character 3D on, X 0°, Y 76°, Z 79° (steps 1–2); in the parent Opacity 0 % (L689). Position: here 0,0,−530, then 0,−35,−530, a negative Z that starts each letter between the word and the camera and lifts it clear of the floor (steps 3, 8); in the parent 0,115, then 0,75, a drop below the line (L688). Based On: here Characters (step 5); Words in the parent (L691). Ease High: here 0 %, left at its default (step 6); −50 % in the parent (L694). Order: here Randomize Order On, Seed 0, as an option (step 9); Off in the parent (L696). Keys: here 0:00:00:00 to 0:00:04:01, the second key dragged later from about 2.84 s, both made Easy Ease (steps 4, 7, 10); in the parent 0:00:01:05 to 0:00:03:06 (L699–L700), linear diamonds (timing, L704). Scene: here extruded, textured 3D letters in a lit Advanced 3D scene, each dragging its own shadow across the floor as it flies (ingredients); in the parent a flat two-line headline on off-white (L680), its layer parented to a null, and the whole block drops into place, most likely on that null (inferred in the parent, L702; the null's keyframes and easing are unknown, L711).
what it does for a beat: A smooth, weighty title entrance for extruded 3D type: each letter starts turned and in front of the lens, then swings into place in a rolling wave, so the word assembles itself without any hard pop.
what it looks like: The frame starts as plain sky; tumbling, rust-textured letters arrive one at a time, each first seen large and close to the lens and spun on two axes, and each shrinks back into its place on the floor with its shadow under it. With random order on, the letters arrive out of sequence: the fourth and fifth letters come in through the right edge, the second drops in from above, the third swings in over the right half, and the first comes in last through the left edge.
ingredients:
- Text animator with per-character 3D (Animate > Enable Per-character 3D) — built-in; shown
- Animator properties Rotation (X, Y, Z Rotation) and Position — built-in; Animate menu shown, Add property menu shown
- Range Selector 1 with its Advanced group (Shape, Ease High, Ease Low, Randomize Order) — built-in
- The lit scene the animation plays in, already built before this span (top to bottom: a point light, a parallel light, an environment light, the text, a floor solid, a backdrop solid) — built-in. Its figures, so this recipe stands alone:
  - Comp 1920x1080, 23.976 fps, Advanced 3D renderer (the renderer, extrusion, bevel and rust-and-pale-blue texture material come from 01); seen through the default active camera in this span, through 06's camera in the result
  - Text: one word of five capitals, Character panel Poppins Black, 100 px, Tracking 17 with the text layer selected (shown). The tracking was 0 at the end of 04 (where two letters touch) and is changed off screen between the two spans: set it to 17 so the letters stand with small gaps and do not collide as they tumble (shown; the word is about 2–3% of the picture wider here than in 04 under the same default camera, 76% against 74% of the width: measured). Layer transform: Anchor Point 151.4,-35.7,0.0, Position 960,540,0, Scale 472% (shown)
  - Backdrop (02): a 2D comp-size solid, pale sky blue RGB about 181,231,252 (#B5E7FC), at the bottom of the stack
  - Floor (02): a duplicate of the backdrop made 3D, X Rotation 90°, Position 960,721,0, Scale 627%, Material Options > Accepts Shadows: Only, so it keeps the backdrop colour and shows only shadows; before the first letter arrives the frame is flat sky with no visible floor (measured:, grey 221 everywhere)
  - Environment light (02): Intensity 187%, Casts Shadows On, Shadow Darkness 100%, X Rotation -25°, Y Rotation keyed linearly 235° at 0:00:00:00 → 195° at 0:00:04:23; this backlight casts every letter's shadow toward the camera, so each flying letter drags its own soft shadow across the floor
  - Parallel rim light (03): Position 2920,-100,2663.3, Point of Interest 960,540,0, Casts Shadows Off, Intensity 216%
  - Point fill light (04): Position 456,530,-666.7, Intensity 100%, Falloff Smooth, Radius 589, Falloff Distance 373, Casts Shadows Off; it brightens the first letter's face by about two-fifths
  - the three lights keep the values they had at the end of 04 (no change to them is shown between the spans: inferred)
steps:
1. Twirl open the text layer, from Animate, choose Enable Per-character 3D (said "enable per character 3D"; shown menu open, ticked)
   - Note: the same Animate menu in this version also lists Front, Bevel, Side and Back submenus (greyed here) beside the usual properties (shown)
2. From Animate add Rotation; with per-character 3D on it brings X Rotation, Y Rotation and Z Rotation (said "add like a rotation value"; shown hovering Rotation, animator with three rotations)
   - X Rotation: 0x+0.0° (shown)
   - Y Rotation: 0x+76.0° (shown)
   - Z Rotation: 0x+79.0° (shown)
3. Add Position to the same animator (said "add in a position"; shown property menu, Position row in Animator 1; the exact click path Add > Property > Position is inferred)
   - Position: 0.0,0.0,-530.0 — a negative Z so the letters start between the word and the camera (said "come past the camera"; shown). In scene-free terms: the animator's position is in the text layer's own space, so the layer's Scale of 472% makes -530 about -2500 comp px; with the default camera 2666.7 px from the word, each letter starts about 165 px in front of the lens, about 94% of the way from the word to the camera (inferred from the values; it is why each letter is first seen huge and cut by a frame edge)
4. Open Range Selector 1 and keyframe Offset from -100% to 100% (said; shown)
   - Offset at 0:00:00:00: -100% (shown)
   - Offset second keyframe: 100%, first set at 0:00:02:20 (shown; position on the ruler matches ~2.84 s)
   - Start 0%, End 100% left at defaults (shown)
5. Under Advanced, set Shape to Ramp Up (said "set the shape to ramp up"; shown dropdown open, landed)
   - Units: Percentage, Based On: Characters, Mode: Add, Amount: 100% (all defaults; shown)
6. Set Ease Low to 100% (said; shown)
   - Ease High: 0% (left at default; shown)
7. Make both Offset keyframes Easy Ease (said "feel free", F9 is said; shown, keyframes changed from diamonds to hourglass easy-ease icons)
8. Lift the animator's Y so the letters do not cut into the floor while they travel (said; shown)
   - Animator Position: 0.0,-35.0,-530.0 (shown; X passes through 8.0 while being scrubbed, then returns to 0.0). In scene-free terms -35 is about 165 comp px up at Scale 472% (inferred)
9. Optional: under Advanced turn Randomize Order on so letters arrive out of order (said "optional"; shown)
   - Randomize Order: On, Random Seed: 0 (shown)
10. Drag the 100% Offset keyframe later, from about 2.84 s to 0:00:04:01, to slow the whole wave down (not said; shown key at ~2.84 s, key selected at 0:00:04:01 with Offset 100%)
11. The work area end is moved along the way (about 4.3 s, about 3.4 s, about 4.1 s); it only limits the preview and does not change the result (shown)
layout: all shares are of the result crop 730,350,1510,845, which lies within 8–17 px of the viewer picture's edges (viewer x 724–2257, y 344–1206), so they are near-true comp shares through 06's camera. Comp time = real time − in this playback (measured from the red playback line in the timeline, 178 px per ruler second: 0.53 s at 334.55, 1.15 s at 335.2, 2.02 s at 336.0, 3.03 s at 337.0, so it plays at real speed). The red preview-time line is the time display that moves across the window; the timecode field stays parked at 0:00:04:23 through this playback and at 0:00:04:01 through 05's own playback (read on frames), so the parked timecode does not make the result a still.
  - named frame (comp about 1.15 s; cut from the source video), letters mid-flight: the second letter nearly in place, slightly tilted, at about 28–49% of the width and 22–69% of the height; the third letter huge, tilted and soft, swinging across about 52–89% of the width from near the top edge (2%) to 73% of the height, in front of the fourth letter; the fifth letter landed at about 79–96%; the first letter not yet in; the floor shadows under the landed letters, plus a large soft shadow at the bottom centre from the third letter (grey about 85 against the sky's 221 at 90–98% of the height) (measured by eye on the crop and by grey level, ±2%)
  - settled word, frame (comp about 2.8 s): word spans about 11%–92% of the width, centred; letter tops at about 33% and bases at about 67% of the height, so the capitals are about a third of the picture height; letters at rest at about 11–28%, 28–44%, 44–64%, 64–78% and 78–92% of the width (measured). In this technique's own framing (default camera, no push, crop 640,262,1366,764, arrow in frame) the settled word spans about 13%–89% with tops at about 33% (measured), so 06's push makes it a little larger
  - floor shadow: the word's own shadow from the environment backlight (02), toward the camera, full width. Top edge about 69% of the height under the word and 72% at the frame edges; darkest at 75–78%, about 0.35–0.5 of the sky level (grey 78–107 against 221), lightening to about 0.7 (grey 150–160) at the bottom edge (measured on columns at 3%, 50% and 97%)
  - background: flat pale sky blue RGB 181,231,252 (grey 221), no gradient (measured)
  - motion, letter by letter (Random Seed 0, same order in 05's own playback and in 06's; comp times from 06's playback; letters named by their place in the word, 1 = leftmost) (measured on frames cut every 0.1 s):
    - 4th letter first: seen at about 0.6 s entering through the right edge in the upper half, turned about 45°, moving left and down; upright by about 0.8 s at about 80–90% of the width, then creeps left into its place (64–78%) by about 1.5 s
    - 5th letter: enters through the right edge at letter height at about 0.9 s, slides left into place (78–92%) by about 1.2 s
    - 2nd letter: seen at about 1.0 s huge, through the top edge over the upper middle (about 15–65% of the width), dropping down and to the left as it shrinks; near its place by 1.2 s, settled by about 1.4 s
    - 3rd letter: seen at about 1.1 s huge over the right half (about 55–100%), swings left as it shrinks, lands at 44–64% by about 1.5 s
    - 1st letter last: enters through the left edge at about 1.3 s huge, lands at 11–28% by about 1.7 s
    - speed: each letter takes about 0.3–0.5 s from first sight to near rest; crossing the frame edge it moves at roughly the picture's width per second (the 4th letter covers about 20% of the width in 0.2 s), then slows to a crawl over its last 0.2–0.3 s; starts come about 0.1–0.3 s apart; the word is down by about 2.0 s except the first letter, which creeps the last 1% of the height until about 2.5 s (its top at 31.4% at 2.0 s, 32.3% at 2.25 s, 32.7% at 2.5 s and after: measured); nothing visible moves after that except 06's camera push (word width 82.6% at 1.7 s, 80.8% at 2.0 s, 81.5% at 3.1 s: measured)
    - every letter is seen nearest the camera first and lands upright; no letter is seen behind the word
timing and easing: comp is 23.976 fps (shown). Range Selector Offset: -100% at 0:00:00:00 → 100% at 0:00:04:01 (final; first set at 0:00:02:20), both keyframes Easy Ease (shown). The animator's own Position and Rotation values are static; only Offset is keyframed. Shape Ramp Up with Ease High 0% / Ease Low 100% gives each letter a soft landing. On screen the visible motion runs from about 0.6 s to about 2.0 s of comp time, plus the first letter's last 1% creep to about 2.5 s; the second half of the 4.04 s Offset ramp moves almost nothing that can be seen (measured; that this comes from Ease Low 100% and Easy Ease is inferred). A build whose letters are all down by about 2–2.5 s is right.
variations: the narrator says there are many ways to animate type and this is one; Randomize Order is optional (said); easy-easing the keyframes is optional (said); raise Y only if letters clip the floor (said)
pitfalls: without Ramp Up the animation does not behave correctly (said, paraphrased); letters can dip into the floor during the move unless the animator Y is raised (said)
build notes: textLayer.threeDLayer = true and textLayer.threeDPerChar = true. Animators: textLayer.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator"); in its "ADBE Text Animator Properties" add Position (ADBE Text Position 3D) [0,-35,-530], X Rotation (ADBE Text Rotation X) 0, Y Rotation (ADBE Text Rotation Y) 76, Z Rotation (ADBE Text Rotation) 79. Range Selector 1: Offset (ADBE Text Percent Offset) keys at 0 s = - (0:00:04:01 at 23.976) = 100, then setTemporalEaseAtKey with KeyframeEase(0, 33.33) on both and KeyframeInterpolationType.BEZIER. Advanced: Shape = Ramp Up (ADBE Text Range Shape), Ease High (ADBE Text Levels Max Ease) 0, Ease Low (ADBE Text Levels Min Ease) 100, Randomize Order (ADBE Text Randomize Order) 1, Random Seed 0. Confirm match names and the Shape enum index in the installed After Effects 27 before relying on them. Set the text's Tracking to 17 (TextDocument.tracking = 17). The text layer's own transform in the tutorial: Anchor Point 151.4,-35.7,0.0, Position 960,540,0, Scale 472% (shown); if the text is built at another scale, keep the scene-free start (about 165 px in front of the lens, about 165 px up) rather than the -530/-35 values. Build the lit scene listed under ingredients first. Another font or seed gives another order: compare the build letter by letter with the order in `layout` only when Seed 0 and a five-letter word are used. The animation itself is all scriptable.
unknowns: no clean result exists for this technique alone: its own playback has the mouse arrow inside the viewer in every frame once the letters appear. The result named above is 06's playback of the same entrance (frame, cut from the source video; the settled frame is saved beside it); in it the depth-of-field blur on near letters and the slight camera push come from 06, not from this technique — in 05's own playback the near letters are sharp (shown). This technique gives the letters' paths, rotations, order and timing. Comp duration and work area length beyond ~4 s are not given; Random Seed is left at 0 and no other seed is tried; whether Easy Ease came from F9 or a menu is not seen

## Caption that fades in dim, fills to full word by word, sharpens from a blur and keeps growing
id: 13-text-fill-in-blur-and-scale-finish
revision: e5af270d
job: reveal-headline; support: keep-it-alive
status: proven (accepted 2026-11-26)
variant of: 18-smooth-text-reveal
differs: the same mechanism as the parent: a text animator holding an Opacity property, its Range Selector 1 Advanced > Based On set to Words, and a keyed sweep of the selector so the words arrive one after another (steps 2, 4, 5; parent steps 2-5, the source video.md L686-L699). Units Percentage, Mode Add and Amount 100 % are the same defaults here (step 5) and in the parent (L692). Animator contents: here Opacity alone, about 10-15 % so the words show as a faint ghost, the final value unread (step 2, unknowns); in the parent Position (0,115 then 0,75) plus Opacity 0 % so the words start hidden and below the line (L688-L689). Which selector property is keyed: here Start 0 % to 100 %, over about 0.7 s, 12:00 to 12:19 (step 4); in the parent Offset -100 % to 100 % over about 2.0 s, with Start 0 % and End 100 % left at default (L697-L700). Selector shape: here Shape Square with Smoothness 100 % (step 5); in the parent Shape Ramp Up, Ease High -50 %, Ease Low 100 % (L693-L695). Extra layers of finish here, none in the parent's section: the whole layer's Opacity keyed 0 to 100 % (step 3), Gaussian Blur Blurriness 25 to 0 landing at about 12:00 (step 6), a new null with Scale 100 to 205 % parented above the earlier null so the block swells (steps 8-9), then the text layer's own Scale cut from 7.1 to 4.5 % and Leading opened to 132 (step 10), and Easy Ease on the keys (step 11); the parent's keys are linear diamonds, its softness coming from the ramp rather than key easing, which the parent itself marks inferred (L704 timing). Scene: here three centred white lines inside a glowing ring on black (layout); in the parent a two-line near-black headline on off-white, its layer parented to a null that the parent infers carries a drop into place, with the null's keyframes unknown (L702, L711).
what it does for a beat: Closing caption for a hero graphic. The words are readable only as a faint ghost at first, then light up one word at a time while the block sharpens and slowly swells, so the shot never stops moving.
what it looks like: Three centred lines of white sans text sit inside a glowing blue-to-cyan ring (the ring is the finished example's orb, drawn as several echoed outlines on black). The text starts as a dim, soft ghost, fills to solid white word by word, and the block then keeps creeping larger.

ingredients:
- Text layer, centred, white fill, three lines — built-in; paragraph text (said: "add a paragraph", fill to white said)
- Text animator with an Opacity property and a Range Selector — built-in; Animate arrow on the text layer, shown
- Gaussian Blur — stock; effect named on screen in the Effect Controls (shown)
- Null object (a new one) with Scale keys, the earlier null parented to it — built-in; Layer > New > Null Object (menu named by the narrator, not on screen)
- Text layer's own Scale, already cut to 7.1 % before this technique starts and then to 4.5 % — built-in; Properties panel (shown)
- Easy Ease on keys — built-in; selected keys, F9 (said)

steps:
1. Put the three-line text in the middle of the comp, fill white, centre-aligned. The text sits inside the ring. (said: add paragraph, centre, white; position inferred)
2. Add a text animator with Opacity, set its value to about 10–15 % so the words are barely visible. Wording is "10, maybe even 15"; the field is seen being typed as 10 (said; shown)
   - Animator Opacity: 10 % typed (shown); the narrator then suggests 15 % and the final value is not read (unknowns)
3. Fade the whole layer in: key the layer's Opacity from 0 % to 100 % over a short span (said; 0 % key shown, 100 % shown)
   - The author says the text is hard to read at this point on purpose, because of the animator's low opacity. (said)
4. In the animator's Range Selector, key Start from 0 % to 100 % to fill the text in. Start 0 % → 100 %; 100 % at comp time 0:00:12:19 (shown), Start 0 % at 12:00 (shown timeline). (said; shown)
5. Under the Range Selector's Advanced group set Based On to Words, so the fill reaches one word at a time. (said; shown : Based On Words, Units Percentage, Mode Add, Amount 100 %, Shape Square, Smoothness 100 %)
6. Add Gaussian Blur to the text layer and key Blurriness 25 → 0, finishing at about 12:00, just as the Start key begins to move (not at 12:19). Blur 25 shown typed (shown crop), 0.0 landed (shown, comp time 12:00, Start still 0 %). Start key of the blur at about 11:15 (inferred from key positions). Blur Dimensions reads "Horizontal and Ve…" (truncated on screen; Horizontal and Vertical is inferred), Repeat Edge Pixels on (shown). (said; shown)
7. Link the text to the orb's shape layer or null so it moves with the ring. (said: either will do; the text layer's Parent column reads a shape layer, and no frame ties the text to either null, so how the text follows the later scale-up is not shown)
8. Create a new null and parent the earlier null (the one already scaled to about 416 %) to it. (said; shown : the new null sits above the earlier one, whose parent reads the new null; earlier null's Scale reads 416 %)
9. On the new null key Scale from 100 % to 205 %, so growth continues after the fill. 100 % key at about 10:22 and 205 % at 12:23 (inferred from key positions; shown for 100 %), 205 % shown Properties panel. Narrator: press S, set a key, drag the value. (said; shown)
10. Make the text smaller and open the line spacing, on the text layer. (said: "a bit smaller", "more spacing")
   - Text layer Scale: 7.1 % (shown, Properties panel crop) → 4.5 % (shown). Position moves with it: -106.5, -95.5 → -105.5, -104.6 (shown).
   - Font size stays 77.5 px (shown): the smaller text is the layer Scale, not the font size.
   - Leading: Auto, then a typed 77 (probably mid-typing), 132 landed. (shown)
   - This cut shrinks the text block to about 0.63 of its width (25.9 % → 16.5 % of picture width, measured vs) while the ring stays the same size: 4.5/7.1 = 0.63, so it matches.
11. Select the keys and Easy Ease them (F9). (said: F9; menu not on screen, so the Easy Ease name is inferred)

layout: (all measured, the final held frame; comp picture 959 × 540 px in the 1920-wide small frame, i.e. 778,338 to 2696,1416 in the full frame, calibrated on the black comp rectangle's own edges; the viewer is at 66.7 % through, so those frames compare directly.)
- Ring: 44 % of the picture width (420/959) and 75 % of its height (404/540), centred at about 47 % across and 50 % down; irregular rounded outline (wider at the lower left), a glowing gradient stroke, deep blue at the lower left through to cyan at the upper right; four or five offset echo copies give the thick, layered edge. The ring is the finished example's orb from earlier in the video (not built here; the Echo effect with Number of Echoes 4 is visible on that layer). The ring is already this size, so the null scale-up is already in effect there; it is about 21 % of the picture width at a null scale of 100 % (44 % ÷ 2.05; consistent with about 262 px's 85.7 % viewer and 310 px's 100 % viewer, same zoom-corrected).
- Text block: 16.5 % of the picture width (158/959), three lines ("By giving you a / starting point / instantly"), line pitch 7.2 % of the picture height (39/540), block centre about 49 % across and 51 % down. White, regular weight. Before the text-layer Scale cut the block was 25.9 % wide with line pitch about 8.7 % of the height (leading Auto): the text swells less than the ring, growing only about 1.3 times while the ring grows about 2.06 times.
- Background pure black. No shadow, no extra glow on the text.
- At the faint stage the text is a grey ghost at about 10–15 % brightness, the ring has its full glow, and the viewer is at a different zoom than the end frames, so ring sizes are not compared between those frames.
- The editor frames (etc.) carry guide rectangles and red selection handles; those are not part of the effect and are not used for the result line.

- FINISHED PIECE (clean render at the start of the video, 28.4–30.85 s, measured on frames, full frame is the picture, ground near-black grey, not pure black): ring 43–44 % of the picture width and 75 % of its height, centre about 46.5 % across and 50 % down; four or five offset echo outlines, deep blue/violet at the bottom to bright cyan at the upper right, soft outer edge. Text block 16.4 % of the width, three lines, line pitch about 7 % of the height, centre about 49 % across and 51 % down, white with the last words just reaching full white. Window: at 28.4 s a soft blue-green blob about 19 % of the width at upper left; at about 28.9 s it is a dark glassy outline with a ghost of the text; at about 29.3 s a thin echoed ring, smaller (about 27 % wide), with the first words visible; at 29.7 s the ring is about 37 % wide; the first two lines are filled and 'instantly' is still dim; all three lines are filled and the ring is full size. After that the ring's echoes keep drifting slowly in shape while its size and the text stay about the same until the (frame difference between is small but not zero). Which traits the steps make: the word-by-word fill, the blur-to-sharp, the text's size relative to the ring. Growth in proportion (measured on frames cut at 29.3 s, 1920-wide: first line 190 px → 312 px wide, i.e. 9.9 % → 16.3 % of the width, x1.64; ring 520 px → 845 px wide, x1.62): in the finished piece text and ring grow together by the same factor over about 1.2 s. The steps here do NOT give this: the build's text grows only about 1.3x against the ring's 2.06x, and no frame shows what ties the text to the scaling null (step 7). To match the finished piece, the text must scale with the ring (e.g. parent the text to the scaling null chain, or key its Scale by the same factor); this is inferred from the measurement, not shown. Also, the first line is still a little greyer than the second line, so the fill is not quite complete there. Not made by these steps: the blob-to-ring opening, the echoed ring and its gradient (from the earlier orb tips); the piece is pre-made and may have extra layers; the framing differs from the editor frames, where the ring sits left of centre inside a larger viewer.
timing and easing: Layer Opacity 0 → 100 % over about 11:07 to 12:01 (keys read, where Opacity shows 94 % at 12:00). Blur 25 → 0 finishes at 12:00. Start 0 % at 12:00 → 100 % at 12:19 (shown), about 0.7 s. Null scale 100 → 205 % over about 10:22–12:23 (inferred). Keys are Easy Eased (F9) last. Key positions are read from timeline pixels, approximate.

variations: Based On can be characters or lines instead of words (inferred from the property being a menu; not said). Pop-up animation is mentioned as an option ("we can do a lot") but not built. Parenting to the shape layer or the null — "whatever you prefer". The author says it looks more luxurious with the text a bit smaller and more spaced.

pitfalls: None given beyond the remark that the dim text is unreadable at first and that is intended.


build notes: Text layer: add Animator > Opacity, set Opacity to about 10–15; Range Selector 1: Start keyframes 0 → 100 %, Advanced > Based On = Words. Layer Opacity keys 0 → 100. Effect > Blur & Sharpen > Gaussian Blur: Blurriness keys 25 → 0. Layer > New > Null Object (x1); set the earlier null's parent to it; Scale keys 100 → 205 on the new null. Text layer Transform Scale 7.1 → 4.5 % (position about -105.5, -104.6); Character panel Leading Auto → 132. Easy Ease selected keys (F9). Timing of keys has to be set by hand to the numbers above.

unknowns:
- Final value of the animator's Opacity (10 versus 15).
- Exact key times (read from timeline pixel positions only).
- How the text layer got its 7.1 % scale at the start (already set before this technique).
- Whether the finished piece's text is parented to the scaling null or scaled by its own keys (measured: it grows x1.64 with the ring's x1.62, but the link is not shown).
- What links the text layer to the later null chain (its Parent column reads a shape layer).
- The finished piece's own key timings and the shown piece's exact values are not on screen; its timings above are read from the clip, not from the build.
- Whether the viewer's last frame shows the growth ended (205 % key sits at 12:23, the time the display holds).

## Text that runs round a drawn path
id: 19-text-on-a-path
revision: d8d51815
job: reveal-headline; support: keep-it-alive
status: proven (accepted 2026-11-14)
what it does for a beat: Wrap a repeated line of type round a circle (or any shape you draw) and slide it along the path, so a badge or seal of words circles a central title.
what it looks like: A short all-caps phrase repeated three times sits in a ring round a bold two-line title, white on near-black; the ring of words travels round the circle as the first margin animates.
ingredients:
- Text layer — built-in
- Mask on the text layer, drawn with the Ellipse (shape) tool or the Pen tool — built-in
- Text > Path Options (Path, Reverse Path, Perpendicular To Path, Force Alignment, First Margin, Last Margin) — built-in; in the text layer's Text group in the timeline
steps:
1. Make a single-line text layer holding the phrase repeated until it is long enough to fill the circle (shown)
   - Font: a heavy geometric sans, Black weight (shown; family name not used here)
   - Size: 35 px, later raised to 48.7 px (shown); a heavy sans at 48.7 px has capitals about 34 px tall, which is the 3.2 % of the height measured in the layout only if the comp is 1080 high (inferred)
   - Tracking: 125 (shown)
   - Fill: white character colour (shown); the layer also carries a Fill effect set to white (shown, Effect Controls)
2. With the text layer selected, draw a closed circular mask on it with the Ellipse tool; the Pen tool works for a custom shape (said; ellipse tool active shown, circle mask shown)
3. Open Text > Path Options and set Path to the mask (said; shown). The type now wraps the circle, letters perpendicular to the path (Perpendicular To Path On, shown; that On is the default is inferred)
4. Set the mask's mode to None so it no longer cuts the layer (shown : Mask 1 mode None)
5. Resize the text so the phrase fills the circle without overlapping (said; size raised to 48.7 px, shown). In the result the three repeats stop short of filling it and leave the gaps given in the layout (measured on a still of the result)
6. Turn Reverse Path On if the type sits inside or reads the wrong way round (said; Reverse Path On shown; after it the letters stand on the outside of the ring reading clockwise)
7. Animate First Margin to make the type travel round the path (said; shown)
   - First Margin keyframe 1: 0.0 at 0:00:00:00 (shown)
   - First Margin keyframe 2: 512.0 at 0:00:03:01 (shown; comp is 23.976 fps)
   - Force Alignment: Off, Last Margin: 0.0 (shown)
8. A separate bold two-line title layer sits in the centre of the ring; it is example content, not part of the technique (hidden, visible: shown)
layout: ring of type: outer diameter about 43% of the comp's width and 76% of its height, i.e. a circle about 0.76 of the comp height across (measured on a still of the result, shares of the whole comp: the viewer is at 43.5% zoom with the comp's edges at the panel's edges, and the result crop covers about 97% of the comp's width, missing a sliver at the right); ring centre at about 50% across, 50% down (measured, same frame, shares of the whole comp); ring letters about 3.2% of the comp's height tall (about 0.042 of the ring's diameter), three repeats of the phrase with gaps of about 12 to 15.5 degrees between them, four to five times the word-spaces of about 3 degrees (measured, same frame, shares of the whole comp); centre title block about 25% of the comp's width by 24% of its height, centred at about 51% across, 51% down, tilted about 10 to 13 degrees anticlockwise (measured, same frame, shares of the whole comp)
timing and easing: First Margin 0 to 512 over about 3 s (0:00:00:00 to 0:00:03:01 at 23.976 fps); no ease given (keyframes look linear, inferred from the diamond icons).
variations: Path can be any mask drawn with the shape tools or the Pen tool (said).
pitfalls: none given (inferred: leaving the mask on Add hides everything outside the circle, which is why it is set to None).
build notes: Script: add a text layer; layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom") with an elliptical Shape (four vertices with tangents), maskMode = MaskMode.NONE. Then layer.property("ADBE Text Properties").property("ADBE Text Path Options"): "ADBE Text Path" = mask index (1), "ADBE Text Reverse Path" = 1, "ADBE Text Perpendicular To Path" = 1, "ADBE Text Force Align Path" = 0, "ADBE Text First Margin" setValueAtTime(0, 0) and setValueAtTime(3.04, 512). Tracking and size via TextDocument (tracking 125, fontSize 48.7). Everything is scriptable.
unknowns: exact phrase length/number of repeats needed; circle diameter not given (measured: the ring is about 0.77 of the comp's height across, about 830 comp px, about 360 px on screen at 43.5%; on); keyframe easing; comp size; whether the mask is inside the text layer or a separate path layer (shown inside, Masks > Mask 1).

## Spinning ring of standing 3D letters, stackable
id: 09-rotating-3d-text-ring-loop
revision: a5ed1d79
job: reveal-headline; support: keep-it-alive, fill-the-backdrop
status: unproven
variant of: 19-text-on-a-path
differs: the same mechanism as the parent: a circular mask drawn with the Ellipse tool on the text layer itself, Text > Path Options > Path set to that mask so the letters follow the circle with Perpendicular To Path On, Force Alignment Off and Last Margin 0, the mask no longer cutting the layer, and the word repeated until it runs all the way round (parent steps 1–4, the source video.md L725–L732, L738). Reverse Path: here Off (step 2); On in the parent (L734). First Margin: here 0, not animated (step 2); in the parent keyed 0 to 512 over 0:00:00:00 to 0:00:03:01, which is what moves the type (L735–L737). Standing ring: here the text is 3D in the Advanced 3D renderer, a per-character 3D animator sets X Rotation +90° so each letter stands up off the path, the layer's own X Rotation −90° lays the circle flat, and the layer drops to Position 960,778,165 near the floor (steps 4–6); the parent's ring stays flat to the camera round a title (L719, L739). Filling the ring: here the mask is enlarged with Free Transform (Ctrl+T) and more copies of the word are typed in (step 8); in the parent the text size is raised from 35 to 48.7 px (L727, L733). Spin: here the anchor is centred on the ring and the layer's Z Rotation runs on time*−30 (steps 10–11); in the parent the type travels along the path through First Margin (L735). Stacking: here a duplicate raised to 960,418,165 runs time*30, so two rings turn opposite ways (steps 12–13); one ring in the parent. Camera: here the camera's parent null is pulled back to Z −1335.7 (step 9); the parent has no camera step. Type: here extruded, textured Poppins Black at layer Scale 472 % (ingredients); in the parent a heavy geometric sans, Black weight, white fill (L726, L729).
what it does for a beat: A seamless looping title or bumper: a word repeated around a circle stands up like a carousel and turns forever, and stacked copies make a tower of rings; good for intros, loops and background type.
what it looks like: Chunky extruded letters with rusted blue-grey painted-metal faces and plain, untextured cream metal sides stand upright around a flat circle and spin on the spot over a pale blue backdrop with a dark floor; two rings are stacked one above the other and turn in opposite directions, and a shallow depth of field blurs the far side.
ingredients:
- Starts from the lit advanced-3D title as technique 07 leaves it, in a fresh copy of that comp with the word repeated. So this recipe stands alone, the scene it needs (figures from those recipes, each shown in its own span):
  - Text (01, 05, 07): Poppins Black 100 px, layer Scale 472 %, 3D layer, comp renderer Advanced 3D, comp 1920x1080 at 23.976 fps; Geometry Options Extrusion Depth 20, Bevel Style Convex, Bevel Depth 2, Hole Bevel Depth 100 %; a rusty blue-grey painted-metal Substance material (.sbsar) on Front, Bevel and Back, texture Scale 17 %, Uniform Tiling on, Randomize Offset on. From 07: Material Assignment Side set back to Default (plain sides), fill colour #FFDCAD, Material Options > Specular Shininess 100 %. In this span the Character fill swatch is pale yellow (shown) and the sides are plain cream metal with no rust (seen on the result frame); the Side override and the shininess are not shown again here (inferred from 07 and the picture). Starting from 01 alone gives rusty sides and will not match.
  - Backdrop and floor (02): a 2D comp-size solid #B5E7FC at the bottom of the stack; a duplicate switched to 3D, X Rotation 90°, Position 960,721,0, Scale 627 %, Material Options > Accepts Shadows: Only (both layers are in this comp's timeline, shown in a).
  - Environment light (02): X Rotation −25°, Y Rotation keyed 235° at 0 s to 195° at 0:00:04:23, Intensity 187 %, Casts Shadows On, Shadow Darkness 100 %; it backlights the rings and casts their shadows towards the camera. Whether this copy of the comp still carries the keys is not shown (08's static 120.5° was set later, in the other comp).
  - Parallel light (03, 04): Position 2920,−100,2663.3, Point of Interest 960,540,0, Intensity 216 %, Casts Shadows Off. Point light (04): Position 456,530,−666.7, Intensity 100 %, Falloff Smooth, Radius 589, Falloff Distance 373, Casts Shadows Off.
  - Camera (06), as seen in this comp at the end: 50 mm two-node camera parented to a 3D null, Zoom 2666.7 px, Depth of Field On, Focus Distance 2962.7 px, Aperture 96.3 px, Focus Area Width 0, Near, Far Blur Level 100,100 % (shown). These differ from 06's Focus Distance 2343.7 and Aperture 30.3; when they were changed is not shown. This deep focus and wide aperture are what blur the far side of the rings.
- Ellipse Tool mask on the text layer — built-in; toolbar shape tools > Ellipse Tool (shown)
- Text Path Options > Path — built-in (shown)
- Text animator with per-character 3D Rotation — built-in; Animate > Rotation with Enable Per-character 3D ticked (shown)
- Composition viewer 2 Views layout with a Top view, Draft 3D — built-in (shown)
- Expression on Z Rotation — built-in (shown)
- Null object (the camera's parent from 06) — built-in (shown)
steps:
1. With the text layer selected, pick the Ellipse Tool and draw a circular mask on it (said; tool menu shown; mask circle in viewer). It is drawn in the default Add mode (shown).
   - Mask 1 mode: Add when drawn (shown); it reads None once it is picked as the text path in step 2, with no click seen, so the switch looks automatic (shown; automatic switch inferred)
2. Under Text > Path Options set Path to Mask 1; the letters now follow the circle (said; shown).
   - Path: Mask 1; Reverse Path Off; Perpendicular To Path On; Force Alignment Off; First Margin 0.0; Last Margin 0.0 (shown)
3. Delete the earlier text animators (the letter entrance from 05) so the ring is static before it spins (said; animator selected for deletion).
4. Click Animate > Rotation (Enable Per-character 3D is ticked) to make a new animator, and set its X Rotation to exactly +90° so each letter turns upright relative to the path (said; menu shown; value shown).
   - Animator X Rotation: 0x+90.0°; Y Rotation 0x+0.0°; Z Rotation 0x+0.0° (shown)
5. In the layer's own Transform set X Rotation to -90°, which lays the circle flat so the letters stand around a horizontal ring (said; shown).
   - Layer X Rotation: 0x-90.0° (shown)
   - Layer Scale is 472.0,472.0,472.0% from the earlier build (shown)
6. Move the layer down so the ring sits near the floor (said "lower this down"; shown).
   - Position: 960.0,778.0,165.0 (shown; crop)
7. Check the ring from above: switch the viewer to 2 Views, set the second view to Top, with Draft 3D on and the viewer extended (said; menu shown; Top view shown).
8. Close the gaps in the ring: select the mask and press Ctrl+T (shortcut said; that it is Free Transform Points is inferred) to enlarge it past the letters' extent, and type more copies of the word into the text so the letters run all the way round (said; the word appears twice and three times).
9. Pull the camera back by moving the null that the camera is parented to (said "use a null object to zoom out"; shown).
   - Null Position: 960.0,540.0,-1335.7 (shown)
10. Centre the text layer's anchor point on the ring before animating; the author opens Layer > Transform for this (stressed; menu shown; the exact submenu item is not seen, inferred: Center Anchor Point in Layer Content).
11. Alt-click the stopwatch of the layer's Z Rotation and enter a time expression with a negative multiplier so the ring spins (said; shown).
   - Z Rotation expression: time*-30 (shown)
12. Duplicate the text layer and move the copy up to stack a second ring; more copies can be added the same way (said; shown, copy is layer 6, original layer 7 keeps its expression).
   - Copy Position: 960.0,418.0,165.0 (shown)
13. Edit the copy's Z Rotation expression to a positive multiplier so the two rings turn in opposite directions (not said; edit in progress, landed: layer 6, the copy, reads time*30 while layer 7, the original, still reads time*-30).
   - Copy Z Rotation expression: time*30 (shown)
   - On screen the lower ring (original, time*-30) carries its near letters from left to right and the upper ring (copy, time*30) carries its near letters from right to left (measured on the result, below).
layout: (all measured on the result frame, a; the viewer picture there spans x 768–2164, y 303–1088 at full size, the whole comp) the two-ring stack is centred horizontally; its nearest letters span about 9% to 91% of the picture width, so the ring's front-on diameter is about 82% of the picture width (measured); upper ring's front letters run from about 17% to 47% of the picture height and the lower ring's from about 45% to 76%, so each band of letters is about 30% of the picture height and the two bands just touch (measured); the floor horizon sits at about 72% of the picture height (measured). In comp units the copy starts at Y 768, where the original was when duplicated (shown in a), passes 468 and 398 and lands at Y 418 (shown), so the rings are about 350 px apart (measured from those two values). Background: flat pale sky blue #B5E7FC (181,231,252) above the floor (measured). Floor in front of the rings: darkest just under the lower ring's near letters at about 76% of the height, about 26,33,35, then lightening slowly to about 45,56,61 at 79%, 53,68,74 at 88% and 63,82,89 at the bottom edge, so the whole floor reads dark, about a quarter to a third of the sky's brightness (measured; from 02's backlight and shadow-only floor with the two rings' shadows overlapping). Sides of the letters: plain cream metal, brightest where the backlight catches the edges (seen; from 07's settings). Depth of field: the near letters of both rings are sharp; letters turning round the far side and the ends of the rings are soft (seen; from the camera values under ingredients). Motion: between cuts 0.1 s apart from 478.4 the upper ring's near letters shift left by about 30 to 47 px and the lower ring's shift right by about 26 to 42 px at full size, about 0.23 to 0.26 of the picture width per second each way (measured by matching horizontal strips through each ring's near letters); this agrees with 30° a second on a ring about 82% of the width across (about 0.21 of the width per second at the front). Nothing else moves: the camera and floor hold still during the result.
timing and easing: Linear, endless spin from the expressions: time*-30 on the original (−30° per second on Z, so one turn every 12 s) (shown) and time*30 on the copy (shown), same speed, opposite directions; rate inferred from the expressions and matching the measured motion. No keyframes.
variations: Two, three or four stacked copies (said). Lower the ring as needed (said).
pitfalls: Centre the anchor point on the ring before adding the spin, or it goes badly (said, stressed); what goes wrong is not said: presumably the ring orbits or wobbles around an off-centre pivot instead of turning in place (inferred).
build notes: By script: textLayer.mask.addProperty("ADBE Mask Atom") with a circular shape, then set maskMode MaskMode.NONE explicitly (in the interface it flips from Add to None by itself when used as the path); Text > Path Options > Path = mask index 1 ("ADBE Text Path Options" > "ADBE Text Path"). Animator: add "ADBE Text Animator" with "ADBE Text Rotate X" = 90 (requires per-character 3D: textLayer.threeDPerChar = true). Layer: transform.xRotation = -90, position [960,778,165]. Expression on transform.zRotation: "time*-30" on the original; after layer.duplicate(), set the copy's to "time*30" and its position to [960,418,165]. Camera Options as seen at the end: Depth of Field 1, Focus Distance 2962.7, Aperture 96.3 (ADBE Camera Focus Distance, ADBE Camera Aperture). Anchor: compute sourceRectAtTime centre or use app.executeCommand for Center Anchor Point in Layer Content. Viewer layout (2 Views, Top, Draft 3D) is interface only. Mask scaling with Ctrl+T is by hand, or scale the mask vertices by script. Duplicate with layer.duplicate().
unknowns: The ellipse mask's size and position and how far it was enlarged; the exact repeated text; the original ring's final Y after the copy was made (it was 778 and 768 when duplicated; whether the original moved again after the copy is not shown); the anchor-point command used; whether the earlier camera push from 06 still runs in this comp; when and how the camera's Focus Distance and Aperture were changed to the values under ingredients (only their end state is shown); whether the environment light's Y Rotation keys from 02 are still on in this comp.

## Paper texture through a title matte, with roughened edges
id: 21-texture-through-a-matte
revision: c33c4c28
job: reveal-headline; support: finish-the-look
status: proven (accepted 2026-11-14)
what it does for a beat: Make a title look printed or stamped into a worn paper texture instead of floating on top of it: the texture itself forms the letters, brightened, and the letter edges are broken up.
what it looks like: A tall condensed all-caps word in grey, made of the same creased, scratched dark paper as the background, with ragged, eroded edges; small white labels sit around it.
ingredients:
- A texture layer (dark creased paper footage or still) and a duplicate of it — built-in; Edit > Duplicate
- A title layer filled black (Fill effect, colour black) — built-in (shown)
- Track Matte column, Alpha matte — built-in (menu shown; alpha matte set shown, crop)
- Curves — stock; Effect > Color Correction > Curves (shown)
- Roughen Edges — stock; Effect > Stylize > Roughen Edges (shown)
steps:
1. Start with the texture as the bottom layer and a black title above it (said; shown, title reads black on the paper)
2. Duplicate the texture layer and move the copy directly under the title (said; shown : two texture layers, copy at layer 6 under the title at 5)
3. Set the copy's Track Matte to the black title layer, Alpha matte, not inverted (said; menu shown, alpha icon shown). The title layer's own visibility is off once the matte is set (shown; its eye is still on)
4. Add Curves to the matted texture copy and lift it so the title reads lighter than the background (said; shown)
   - Channel: RGB (shown)
   - Curve: white point dragged far left, roughly input 33 of 255 to output 255, a steep straight line (read by eye from the opening preview of the finished state, inferred; during the build the drag is still in progress at about input 100). The white point only has meaning against the texture's own levels: in a proof build a paper peaking near 77 of 255 clipped the title to white at this setting and one peaking near 29 read grey, so set the lift by the result, letters about six times the paper's level as in the tutorial (median about 87 to 90 against 15, measured), and not by the number (inferred: the dependence was found in a proof build)
5. On the title layer (the matte), add Roughen Edges (said; title layer selected and Roughen Edges found under Stylize; effect on the title layer shown)
   - Edge Type: Roughen (shown; that it is the default is inferred)
   - Border: scrubbed through 26.10 (shown) and 20.00 (shown), ending at 19.00 (shown); a starting value of 8.00 comes from the text reader, not checked on a frame
   - Edge Sharpness: 1.00 (shown) → 10.00 (shown)
   - Fractal Influence: 1.00 (shown)
   - Scale: 100.0 (shown) → 10.0 (said "lower the scale"; shown)
   - Stretch Width or Height: 0.00; Offset (Turbulence): 0.0, 0.0; Complexity: 2 (shown)
   - Evolution: 1x +161.4° (shown)
6. The title layer also carries a Displacement Map that pushes the letters with the texture (shown; not narrated)
   - Displacement Map Layer: the bottom texture layer, Effects & Masks (shown)
   - Use For Horizontal: Red, Max Horizontal Displacement: 0.0 (shown)
   - Use For Vertical: Green, Max Vertical Displacement: 46.0 (shown)
   - Displacement Map Behavior: Center Map; Wrap Pixels Around: off; Expand Output: on (shown)
layout: title word: about 54% of the comp's width wide (left edge at 23%, right at 77%) and 42% of its height tall (top at 26%, bottom at 68%), centred at about 50% across, 47% down (measured, shares of the whole comp: the viewer is at 41.4% zoom and the result crop takes in the whole comp); letter strokes about 2.2 to 2.4% of the comp's width thick; roughened edge breaks up the outline by about 0.5% of the comp's width (measured, same frame); small label line under the title at about 77% down, about 15% of the width wide; top label line centred at about 12% down; bottom-left label block at about 4% in, 85 to 94% down (measured, same frame, shares of the whole comp)
timing and easing: none given for the technique (the title has an "IN" layer marker, shown, so it likely animates on; not covered).
variations: Works for "anything", a title or a graphic, as long as the matte layer is black (said).
pitfalls: Once matted, the texture copy matches the background, so the title nearly vanishes (shown, title faint; inferred cause: it is the same texture); Curves is what brings the title back (said). Lowering Roughen Edges Scale is what blends the edge into the grunge (said).
build notes: Script: tex2 = tex.duplicate(); tex2.moveAfter(title) (must sit directly below the matte); in AE 2023+ tex2.setTrackMatte(title, TrackMatteType.ALPHA), older: tex2.trackMatteType = TrackMatteType.ALPHA with title directly above; title.enabled = false. Curves ("ADBE CurvesCustom") curve points are not scriptable: set by hand, or substitute Levels ("ADBE Easy Levels2") with Input White about 33/255 (inferred equivalent). Title: Fill ("ADBE Fill", Color black), Displacement Map ("ADBE Displacement Map"), Roughen Edges ("ADBE Roughen Edges") with "Border" 19, "Edge Sharpness" 10, "Scale" 10, "Complexity" 2, "Evolution" 161.4 + 360 deg. With Max Vertical Displacement 46 the Displacement Map moved the whole title about 40 px down in a proof build whose stand-in texture had a green channel far from mid grey, so check the title's place after adding it (inferred: found in a proof build, not said or shown).
unknowns: the texture source; title font, size and colour beyond black; exact curve points; whether the Displacement Map is meant as part of this technique; the title's in-animation.

## Frame video in a custom shape with a track matte
id: 25-custom-media-frame
revision: 8c6d3c5f
job: show-real-screen; support: reveal-headline
status: proven (accepted 2026-11-14)
what it does for a beat: When a photo or clip should sit in a designed window rather than a plain rectangle (for example, a cut-out that leaves room for a headline), draw any shape and use it as the clip's matte.
what it looks like: On a white slide, a dark building photo fills a wide frame whose lower middle is notched out, so a white panel with a large black headline sits inside the notch; the image reads as a custom-shaped placeholder.
ingredients:
- Shape layer drawn with the Rectangle tool (or the Pen tool) — built-in
- Track Matte column (Alpha Matte) on the media layer — built-in
steps:
1. Draw the frame shape with the Pen tool or shape tools (said); here, three rectangles inside one shape layer (shown)
   - Rectangle 1: a wide bar across the top (shown)
   - Rectangles 2 and 3: two blocks hanging down at the left and right, leaving a gap in the middle for the text (shown)
   - Rectangle 3 Size: 595.0, 1285.0 (shown)
   - Rectangle 3 Roundness: 20.0 (shown)
   - Rectangle 3 Position: 1374.5, 261.5 (shown)
   - Comp: 3840 x 2160 (measured: a 3840 comp at the 20% zoom readout is about 1378 px on screen and the result crop is 1376 px)
   - Fill: grey; Stroke Width 3.0 with the stroke switched off (shown)
   - The clip layer's visibility (eye) is off while the shape is drawn, so the grey shape is seen over the slide (shown)
2. Drag the video or image layer from below the shape (layer 3) to directly above it (layer 1, shape on layer 2; shown)
3. Turn the clip layer's eye back on; a hidden layer renders nothing even with a matte (shown cursor on the eye column, eye on; the reason is inferred)
4. Set the clip's Track Matte to the shape layer, alpha matte (said "matte your video or images to it"; shown, Track Matte "2. Shape L…" with the alpha icon)
5. The shape layer's visibility turns off and the clip shows only inside the shape (shown)
layout: whole frame: about 87% of the comp's width (6.3% to 93.4% across) by 59% of its height (33% to 92% down) (measured, shares of the whole comp: the viewer is at 20% zoom and the result crop takes in the whole comp; the comp is 3840 x 2160: the viewer reads 20% and the crop is 1376 px wide against about 1378 px for a 3840 comp at that zoom, measured); top bar about 29% of the comp's height deep across the full frame width; left and right blocks each about 15.4% of the comp's width wide, running the full frame height; the notch between them about 56% of the width wide and 30% of the height deep, centred at 50% across (measured, same frame, shares of the whole comp); corner rounding about 0.4% of the comp's width (measured, same frame); the headline in the notch about 52% of the width wide, capitals about 12% of the height tall, centred at 50% across (measured, same frame, shares of the whole comp)
timing and easing: none given
variations: Any shape made with the pen or shape tools works (said)
pitfalls: none given
build notes: Add a shape layer with three `ADBE Vector Shape - Rect` groups (Size, Position, Roundness) and a Fill; put the footage layer above it with `footage.enabled = true` (a hidden footage layer renders nothing), then call `footage.setTrackMatte(shapeLayer, TrackMatteType.ALPHA)` (AE 23+; older: move footage directly above and set `trackMatteType`). All scriptable. The Rectangle Position values on screen are in the shape layer's own space with the layer left at the comp centre; read that way in a 3840 x 2160 comp, Rectangle 3 lands on the layout's right block (inferred: found in a proof build, not said or shown).
unknowns: Sizes and positions of Rectangles 1 and 2; the fill colour value. A later shot shows the same layout with clearly rounded corners on every edge, but the step that rounded them is not shown (Roundness reads 20 throughout).

## Rounded-rectangle matte card that carries its media and labels
id: 01-rounded-shape-matte-media-card
revision: 6305ccdf
job: show-real-screen; support: list-items
status: unproven
variant of: 25-custom-media-frame
differs: the same mechanism as the parent: a shape layer drawn with the Rectangle tool sits directly under the photo or clip, the media's Track Matte is set to that shape as an alpha matte, and the shape's own visibility goes off so the media shows only inside it (parent steps 1, 2, 4 and 5, the source video.md L919, L928, L930, L931). Shape: here one upright rectangle, Rectangle Path Size 556 × 712, Roundness 54, centred in the frame (steps 1–3); in the parent three rectangles in one shape layer, a top bar and two hanging blocks that leave a notch for a headline, Rectangle 3 at Size 595 × 1285 and Roundness 20 (L919–L923). Order: here the photo is dropped in directly above the shape (step 4); in the parent the clip starts below the shape, is dragged above it and has its eye turned back on, since a hidden layer renders nothing (L928–L929). Parenting: here the photo (Scale 70 %) and every overlay (a two-line headline, two pill tags with a word in each, a logo) are parented to the shape, so one layer moves and scales the whole card, and the overlays carry no matte so they sit on top of it (steps 6, 8, 9); the parent has no parenting step (its steps, L919–L931). Comp: here about 1920 × 1080 at 23.976 fps (step 1); the parent's comp is 3840 × 2160 (L925).
what it does for a beat: Turns any photo or clip into a tidy rounded card whose size and position are driven by one shape layer, so the card can later be swung, scaled or duplicated as a unit. Reach for it as the base piece of any card carousel or media stack.
what it looks like: A portrait photo of a model, cropped into a rounded upright card in the middle of a plain cream frame, with a bold two-line white headline, two small outlined pill tags laid over the lower part of the card, and a small white logo mark in the card's top-left corner.
ingredients:
- Shape layer from the Rectangle Tool — built-in; toolbar shape-tool flyout (Rectangle Tool shown)
- Track Matte (alpha matte from the shape layer) — built-in; Track Matte column of the timeline (shown)
- Parenting (Parent & Link) — built-in; Parent & Link column (shown)
steps:
1. Pick the Rectangle Tool from the shape-tool flyout and drag out an upright rectangle in the composition (said; tool menu shown)
   - Composition: about 1920x1080, 23.976 fps (fps shown; size inferred from the rectangle filling 29% x 66% of the picture at 556x712)
   - Rectangle Path Size: 556.0,712.0 (shown)
   - Rectangle Path Position: 0.0,0.0 (shown)
   - Fill: black, Stroke off (shown; the fill colour does not matter because the layer is only used as a matte — inferred)
2. Centre the shape layer in the frame (said, stressed as exact; the Align panel is set to "Composition", but no click on an align button is seen — how it was centred is inferred)
   - Shape layer Position: no settled readout is ever on screen. The only readouts come during the drag-away-and-back test (step 9), while the value is being scrubbed: Y stays 538.0 and X passes 868 to 1448 (cuts from); these are values passed through, not the layer's set position. The recording then cuts (X reading 768, card left of centre) to a state where the card is centred again. Measured on the result frame, the card's centre sits at 0.501 x 0.501 of the picture, so aim for the comp centre, 960,540 (measured; the 538 seen while dragging is within reading error)
3. Open Contents > Rectangle 1 > Rectangle Path 1 and raise Roundness to round the corners (said)
   - Roundness: 54.0 (shown; dragged up through 20 and 41 first)
4. Drop the photo or video into the comp directly above the shape layer (said; shown, photo layer at index 1 above the shape layer)
5. On the photo layer set Track Matte to the shape layer, using the alpha matte (said "track matte"; matte chosen shown; alpha rather than luma is inferred from the matte icon)
   - The shape layer's own visibility goes off when it becomes the matte (shown, eye column empty on the shape layer)
6. Scale the photo inside the card until it frames well (said "control the sizing")
   - Photo Scale: 70.0,70.0% (shown)
7. Rename the shape layer so it is easy to find, for example "matte" (shown; not said)
8. Parent the photo layer to the shape layer so moving or scaling the shape moves the photo with it (said; shown, photo layer Parent = the matte layer)
9. Add the overlay elements on top — a two-line headline text layer, two pill-shaped outline boxes with a one-word text tag in each, a small logo image — and parent every one of them to the shape layer too (said; shown, all six overlay layers parented to the matte layer)
   - Optional test: after parenting the photo, the matte's Position is dragged away and back to show the photo following it (shown); it is put back, so it does not change the result
   - The overlay layers have no track matte (Track Matte = No Matte, shown), so they sit on top of the card rather than being cut by it
   - The overlays are switched on one at a time while the layers are set up (shown); this is housekeeping, not part of the look
layout: background a flat, full-frame cream solid, RGB about 247,244,237, the same value in all four corners and mid-edges of the result crop, with no vignette, gradient or grain (measured on a still of the result; the layer is present); card width about 29% of the picture width and height about 66% of the picture height, centred both ways (measured on the result frame: 491 x 634 px in the 1688 x 948 crop, centre 0.501 x 0.501); the card is flat, with no drop shadow, edge glow or stroke: the two rows just below its bottom edge are a lighter anti-aliased fringe, and from the third row down the pixels are within 4 levels of the background, exact from the seventh (measured at the card's centre column and near its left corner); corner radius: Roundness 54 shown, which in After Effects is the radius in comp pixels (about 10% of the 556 px card width); measured on the result crop the corner fits a circle of about 45 crop px on the 491 px card, about 51 comp px or 9% of the card width, the same on the top-left, top-right and bottom-left corners (measured; within reading error of 54); headline sits in the lower third of the card, left-aligned with a margin of about 7% of the card width, letter height about 6% of the picture height; pill tags under the headline, each about 4% of the picture height tall; logo mark in the card's top-left corner, about 7% of the card width in from the left edge and about 5% of the card height down, roughly 11% of the card width wide (measured on the result frame, also visible)
timing and easing: none given (this part is static set-up)
variations: any media works — photos or video (said); any shape can be drawn (said "any shape that you want")
pitfalls: the shape must be exactly centred in the frame (said, stressed); the media and all text and graphics must be parented to the matte shape so one layer moves everything (said, stressed as "most importantly")
build notes: by script — layers.addShape(); add "ADBE Vector Group" with "ADBE Vector Shape - Rect" (Size [556,712], Roundness 54) and "ADBE Vector Graphic - Fill"; set layer Position to the comp centre; import the media, move it above the shape, then mediaLayer.setTrackMatte(shapeLayer, TrackMatteType.ALPHA) (AE 2023+; older versions: put the shape directly above and set trackMatteType = TrackMatteType.ALPHA); mediaLayer.parent = shapeLayer and the same for each text, box and logo layer; media Transform > Scale [70,70]. Nothing here needs the interface.
unknowns: exact composition size (inferred 1920x1080); how the layer was centred (align button or position typed) and its settled Position value; fonts, sizes and colours of the headline and tags; size and roundness of the pill boxes; the logo artwork; whether the photo is a still or a clip in the finished build (a still is used here)

## Card that swings round a pivot below the frame, one step at a time, forever
id: 02-pivot-null-swing-loop
revision: faf0d084
job: list-items; support: keep-it-alive
status: proven (accepted 2026-11-19)
what it does for a beat: Gives a card (or later a row of cards) a carousel step: it swings in from one side on a big arc, settles upright, pauses, then swings out the other side, and the step repeats endlessly from only three keyframes. Use it for product or photo carousels, list reveals, or any "next item" rhythm.
what it looks like: The rounded photo card from 01-rounded-shape-matte-media-card arrives from the lower right tilted about 34 degrees, rocks up into the centre on a wide arc and holds upright; the next step carries it on the same arc to the mirror of where it started, lower left and tilted about −34°, where it holds again with its lower-left corner about 6% of the picture height below the frame's bottom edge, the card cut by that edge along about 8% of the picture width; only the step after that (−68°) takes it mostly out of frame, one corner still showing at the lower left. Each cycle adds another −34°, so a single card never comes back.
ingredients:
- The matte card from 01-rounded-shape-matte-media-card (shape matte with media and overlays parented to it)
- Pan Behind (Anchor Point) Tool — built-in; toolbar (said)
- Null Object — built-in; Layer > New > Null Object, Ctrl+Alt+Shift+Y (menu shown)
- loopOut("offset") expression on Rotation — built-in (said; shown)
- Easy Ease (F9) and the Graph Editor speed graph — built-in (said)
steps:
1. Build the card as in 01-rounded-shape-matte-media-card (inferred link; said "builds on")
2. With the Pan Behind tool, drag the matte layer's anchor point down to the bottom edge of the card, centred (said; result shown, Anchor Point 3.8,359.8 on a 712 px tall rectangle, so the anchor sits on its bottom edge)
3. Make a null object (said; New > Null Object menu shown)
4. Parent the matte layer to the null (said; shown, matte layer Parent = the null)
5. With the Pan Behind tool, drag the null's anchor point straight down below the composition to where the swing should pivot (said; shown, the null's anchor sits centred horizontally below the frame)
   - Pivot: centred, about 0.36 picture heights below the bottom edge of the frame, i.e. about 0.53 picture heights below the card's bottom edge (measured)
6. Test the arc by scrubbing the null's Rotation value back and forth and watching the card travel round the pivot (shown, scrub cursor on the Rotation value; the timeline also records about −81° during this stretch; not said; the value is then put back to 0)
7. On the null's Rotation, set a keyframe of 0 degrees around frame 20 (said "around 20 ish frames"; shown, key at about 20 f, 0x+0.0°)
8. Go to frame 0 and rotate the null so the card sits off to one side (said; shown)
   - Rotation at 0 f: 0x+34.0° (shown; card to the right)
9. Add a third keyframe a few frames after the 0-degree one, with the same value, to make a short hold (said; shown, a third key about 3 f later)
   - Final key times after retiming: 0 f (+34°), 17 f (0°), 24 f (0°) at 23.976 fps (shown, measured on the timeline ruler; the move from 20 f to 17 f is not seen being done)
10. Alt-click the Rotation stopwatch and type the offset loop (said; the auto-complete list of continue / cycle / offset / pingpong shown)
   - Expression: loopOut("offset") (shown)
   - Each cycle now adds another −34° step and its own 7-frame hold, so the card goes right (+34°) → centre (0°, hold) → lower left (−34°, hold) → mostly out (−68°) (inferred from how offset looping works; confirmed in the playback, cut every 0.05 s from 133.5, upright hold, swing, left hold, next step, then a still corner at the lower left)
11. Select the first two keyframes and apply Easy Ease with F9 (said; hourglass Easy Ease icons on keys 1 and 2, third key left linear, shown)
12. In the Graph Editor (speed graph), pull the ease handles out to make a strong, symmetric ease in and out (said "smooth out the animation however you need"; final shape shown and unchanged, just before the playback)
   - Key 1 outgoing handle: Speed 0.00 °/s, Influence about 77% (shown, a tooltip reading 76.71% read while the handle is still being dragged, so a value passed through; the settled graph has the same shape, so about 77% stands as approximate)
   - Key 2 incoming handle: about the same length, so about 77% too (inferred from the matching handle length)
   - Resulting speed graph: peak about −199 °/s at about frame 8.5 of the 17-frame swing, symmetric, near-zero speed for the first and last few frames (shown, read off the graph's degree scale)
   - On the way the author drags an earlier, lopsided shape (peak about −116 °/s near frame 5, mid-drag); that is not the final shape
layout: card upright and centred at the hold, card about 29% of picture width and 66% of picture height (measured, unchanged from 01); the card keeps this size through the whole swing, with no shrink or lean of its own (that is 03) (measured: its pixel area is 18.9% of the picture upright and 18.5% at the left hold); at the left hold (−34°) the card's centre sits about 23% across and 64% down, its lower-left corner about 6% of the picture height below the frame's bottom edge, so the bottom edge cuts the card along about 8% of the picture width, from about 19% to 27% across (measured on the last picture row of a full, the corner depth from the geometry: centre 64% down, −34° tilt puts the lower-left corner about 450 comp px below the centre); after the next step (−68°) only about a third of the card shows, low in the bottom-left corner (measured); motion is right to left: each step carries the card's centre about 27% of the picture width, almost all of it in about 5 comp frames mid-swing, peaking at about 1.5 picture widths per second (from about 7.8° per comp frame on a pivot about 0.48 picture widths below the card centre; measured); at frame 0 the card centre sits about 77% across and 62% down the picture, tilted +34° (measured); pivot centred about 0.36 picture heights below the frame's bottom edge (measured)
timing and easing: 23.976 fps; null Rotation keys 0 f = +34°, 17 f = 0°, 24 f = 0° (24-frame cycle: 17 f swing, 7 f hold); Easy Ease on the first two keys, then both handles pulled to about 77% influence for a symmetric ease with a peak of about 199 °/s mid-swing; loopOut("offset") repeats the step forever
variations: none given beyond "however you need" for the graph shape (said)
pitfalls: parenting the card to a null that is itself moved creates layers of parenting ("null-ception", said); without a loop expression the keyframes only play one swing (said); without easing the step looks mechanical (said: ease is highly suggested)
build notes: by script — matte.property("ADBE Transform Group").property("ADBE Anchor Point") set to [0, rectHeight/2] and Position compensated so the card does not jump (the Pan Behind tool does this compensation by hand); var n = comp.layers.addNull(); move the null's anchor/position so its position lies at [compW/2, compH*1.36]; matte.parent = n; n Rotation setValueAtTime(0,34), (17/23.976,0), (24/23.976,0); expression 'loopOut("offset")'; KeyframeEase on keys 1–2: key 1 outgoing new KeyframeEase(0, 76.71) and key 2 incoming new KeyframeEase(0, about 77) (key 1 value shown; key 2 inferred from its matching handle); key 2 outgoing and key 3 can stay linear. Nothing needs the interface.
unknowns: how the keys moved from about 20 f / 23 f to 17 f / 24 f (somewhere in, not checked); the exact influence of key 2's incoming handle; the null's exact position values; the composition length; whether anything else in the comp is animated

## Card shrinks and leans outward at the ends of its swing
id: 03-tilt-and-shrink-on-swing
revision: 27af439d
job: list-items; support: point-at-detail
status: proven (accepted 2026-11-19)
what it does for a beat: Adds a size-and-lean change on top of the pivot swing so the card is small and tipped outward while it is off to the side and full size and upright when it reaches the top. This is what makes a swinging carousel feel like it is "resizing" and gives the centred item its emphasis.
what it looks like: The rounded photo card enters from the lower right at about two-thirds size and leaning hard outward, grows to full size as it rises upright into the centre, holds, then shrinks and leans outward again as it falls away to the lower left.
ingredients:
- The swinging card from 02-pivot-null-swing-loop (matte card parented to a pivot null with a looping rotation)
- Scale and Rotation keyframes on the matte shape layer — built-in (said)
- Easy Ease (F9) and the Graph Editor — built-in (shown)
steps:
1. Start from the finished 02-pivot-null-swing-loop set-up: null keys 0 f +34°, 17 f 0°, 24 f 0° with loopOut("offset") (inferred link; null keys still visible)
2. Select the matte shape layer (the card) and open Scale and Rotation; its anchor is already on the card's bottom edge (shown, Anchor Point 3.8,359.8)
   - Housekeeping: the photo, text, box and logo layers are hidden from the timeline with the shy switch, leaving only the null, the matte and the background listed (shown); this does not change the picture
3. At frame 17, where the null reaches 0°, set keyframes for Scale and Rotation at full size and upright (said "hold the sizing rotation at the top"; shown)
   - Scale: 100.0,100.0% (shown)
   - Rotation: 0x+0.0° (shown)
4. At frame 0, where the card sits to the right, set Scale and Rotation so the card is smaller and leans further outward (said "slightly tilt and scale down"; shown and again)
   - Scale: 68.0,68.0% (shown)
   - Rotation: 0x+23.0° (shown; added on top of the null's +34°, so the card leans about 57° in all — inferred sum)
5. At frame 24, where the null's hold ends, add a matching full-size, upright key so the card holds at the top (shown, a third key added with 100% and 0°; the author says to hold the size and rotation at the top)
6. At frame 41, where the null's next step has carried the card to the left (24 f + 17 f), set the shrink and lean again in the other direction (said: repeat the shrink and tilt when the card reaches the other side)
   - Scale: 68.0,68.0% (shown)
   - Rotation: 0x−22.0° (shown; the key first reads 68% and +23° — that it was copied and pasted from frame 0 is inferred, no copy or paste is seen — then it is changed to −22, so the card leans about −56° in all with the null at −34° — inferred sum)
   - Key times measured on the timeline ruler: 0 f, 17 f, 24 f, 41 f (shown)
7. Smooth the Scale and Rotation keys (said "smooth out those keyframes if you want")
   - Easy Ease on all four keys of both properties: hourglass icons on every key (shown in a; all four keys selected)
   - Then in the Graph Editor the handles are pulled long: a tooltip on the first key's outgoing handle reads Speed 0.00 °/s, Influence 86.23% (shown in a, read while the handle is still being dragged, so a value passed through, not a settled key: the same handle is still short, and the graph is closed; take it as about 86%)
   - Resulting speed graphs for Scale (red) and Rotation (cyan): near zero speed around every key, with one narrow, tall spike inside each change: at about frame 7.5 of the 0–17 f stretch and about frame 32 of the 24–41 f stretch (Rotation peaks roughly −500 °/s and beyond the graph's lower edge; shown, key positions measured on the graph), so each change is slow at both ends and very quick in the middle; the other handles' influences are not readable and are taken as the same (inferred)
layout: at the centre hold the card is 29% of picture width and 66% of picture height, upright, centred (measured, from 01); at the side extremes the card is about 20% of picture width (68% of full size), its centre about 77% across and 77% down the picture on the right and about 23% across and 76% down on the left, leaning about 57° outward, so it partly drops below the frame's bottom edge (measured on editor frames with handles); Scale and Rotation act about the anchor on the card's bottom edge (from 02), so the card shrinks down towards its bottom edge and tips about it: that is why the shrunk side card sits low, partly below the frame, rather than floating at mid-height (inferred from the anchor, matches the frames); after 41 f a single card holds at 68% and −22° (about −56° in all) at the lower left until the null's next step carries it out of frame (inferred from the keys; no key after 41 f is shown); in the reference result (see `result`) the centre card is visibly smaller and leaning and full size and upright, 29.4% of the picture wide (still tilting slightly) and 67% tall (measured on a still of the result to), while the incoming copy at the lower right shows the frame-0 state: 68% size, leaning about +57°, centre about 78% across and 78% down; the left side is empty at that moment because no card precedes the first one; the incoming card is drawn in front of the centre card (its corner covers the centre card's red lower-right corner); the background is the flat cream of 01
timing and easing: 23.976 fps; matte keys at 0 f (68%, +23°), 17 f (100%, 0°), 24 f (100%, 0°), 41 f (68%, −22°), timed to the null's 0 f / 17 f / 24 f / 41 f positions; Easy Ease on all keys, then strong eases with long handles (first key outgoing influence about 86%, read mid-drag; the others assumed similar, inferred)
variations: the smoothing is optional (said "if you want")
pitfalls: none given
build notes: by script — on the matte layer: Scale setValueAtTime at 0, 17, 24, 41 frames (÷23.976) with [68,68], [100,100], [100,100], [68,68]; Rotation ("ADBE Rotate Z") with 23, 0, 0, −22; apply KeyframeEase(0, 86) in and out on every key to match the first-key handle read mid-drag (the other keys' values inferred). The null's Rotation loops with loopOut("offset"), but the video does not show any loop on the matte's Scale and Rotation, so as built here they play once (0–41 f); a single card that leaves the frame after 41 f does not need more, and in a multi-card chain each copy carries its own keys (see the next step of the video, not part of this recipe).
unknowns: the influence of every handle (the first key's outgoing 86.23% was read mid-drag); whether the matte's keys are looped by an expression; why the left-side lean (−22°) differs from the right-side lean (+23°) by one degree; a clean playback of the single-card effect (only the chained build of 04 is played clean)

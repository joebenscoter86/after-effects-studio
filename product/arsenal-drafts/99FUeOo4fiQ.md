# Techniques from one video (1 recipes, 1 proven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none is in the plugin. `status: proven` means it was built in After Effects from the recipe alone, compared with the tutorial's own result, and accepted by Joe (1 of 1); `status: unproven` means it has not been.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round | Status |
|---|---|---|---|---|
| 01 | Slider-driven minutes:seconds countdown timer | type; workflow; trending formats | 3 | proven |

## Slider-driven minutes:seconds countdown timer
id: 01-slider-driven-countdown-timer-expression
status: proven (accepted by Joe 2026-11-26: rebuilt in After Effects on generated artwork from this recipe alone, reviewed against the tutorial's result and phone MP4s sent; he said "accepted")
variant of: 01-value-driven-counter (SKU3QdqKLOs #01)
differs: Shared: a Slider Control keyed between two values, and a text layer's Source Text expression that reads the slider through `Math.round(...)` so the text shows whole numbers (parent steps 2 to 6), with linear keys (the parent shows them linear, f004027; here linear is inferred), Montserrat Black on white, and a count that changes only the digits. Differences: here the Slider Control sits on the text layer itself and the expression reads `effect("Slider Control")("Slider")`; in the parent it sits on a separate null object, is renamed `Value 1` and is linked by pick-whip (parent steps 2 to 4). Here the expression splits the rounded value into minutes and seconds with an `addZero` helper and joins them as `MM:SS`; in the parent it adds only a `"%"` suffix (or a `"$"` prefix) to the number (parent steps 7 and 8). Here the keys run 60 at the first frame to 0 at the last frame of a 60 s, 30 fps comp, a countdown that reads as a clock; in the parent they run 0 at 0:00 to 83 at 3:00 on a 23.976 fps time base, counting up (the parent lists counting down only as a variation). Here the project's Expressions Engine is switched to Legacy ExtendScript to clear an expression error (step 6); the parent has no such step. Here the text is 200 px and centred in the comp with the Align panel; in the parent it is 111 px and left-aligned, its left edge fixed at about 22.4 % of the width.
source: 99FUeOo4fiQ 0–121 s
jobs: type; workflow; trending formats
what it does for a beat: Put a live countdown clock (MM:SS) on screen when a scene needs a timer, a deadline or a ticking tension beat. Only one number is keyed, so the length is changed by editing two key values.
what it looks like: A heavy, wide, rounded white sans-serif "MM:SS" sits dead centre on a black frame and ticks down once a second from 01:00 to 00:00, always with two digits each side of the colon.

ingredients:
- Text layer (Type tool) — built-in; Type tool in the toolbar (shown f000628)
- Slider Control — stock; Effects & Presets, searched "slider", sits under Expression Controls (shown f002771)
- Source Text expression — built-in; Text > Source Text, alt/option-click the stopwatch (said); expression text from the pinned comment
- Align panel — built-in; Align Layers to: Composition (shown f004081)
- Project Settings > Expressions > Expressions Engine — built-in; File > Project Settings (shown f003097)

steps:
1. Start from an empty comp, 1920x1080, 30 fps, 1 minute long (one minute said; 30 fps shown f000628 in the time display; height 1080 px read from the on-screen text of the composition-settings dialog in the timeline, the dialog frame itself not viewed by me; width 1920 inferred from the 16:9 picture). Black background (shown f000628).
2. Choose the Type tool, click in the viewer, type a single character "0", then click away to commit the layer (said; result shown f002771: white bold "0").
   - Fill: white (shown f002771)
   - Font: Montserrat, style Black (shown f001045, Character panel)
   - Size 200 px, leading 160 px, tracking: Metrics / 0, scale 100 % / 100 %, baseline shift 0 px (shown f001045)
   - Fill: white (also the swatch in the Character panel, f001045)
3. Add Slider Control to that layer: search "slider" in Effects & Presets and apply it (said; shown f002771). Slider starts at 0.00 (shown f002771).
4. Open the layer's Text group, alt/option-click the stopwatch beside Source Text to open an expression (said; stopwatch shown f002771 "Expression: Source Text").
5. Paste the author's expression (said (pinned comment); text on screen f002771):
   ```
   slider = Math.round(effect("Slider Control")("Slider"))  
       
   sec = slider%60 
   min = Math.floor(slider/60) 

   function addZero(n){ if (n<10) return "0" + n else return n } 

   addZero(min) + ":" + addZero(sec)
   ```
   - What it does (inferred from the code): slider is rounded to whole seconds, minutes = whole 60s, seconds = remainder, each padded to two digits, joined by a colon.
6. A warning bar "This project contains an expression error" appears after the paste (shown f002771). Fix: File > Project Settings (shown f003097; the narrator names the dialog), Expressions tab, set Expressions Engine from JavaScript to Legacy ExtendScript, click OK (dropdown open with both entries shown f003408; the choice is said, the landing is not on a frame I cited). After it the text reads 00:00 (shown f004081).
   - Expressions Engine: Legacy ExtendScript (said)
7. Centre the text: select the layer and in Align set Align Layers to Composition (said "align into the middle"; panel shown f004081). The text is already horizontally centred at f004081 (block 843–1183, centre 1013 against comp centre 1012); only the vertical move is evidenced (block centre y 383 at f004081 → 402 at f006763, the comp's centre). Which button was clicked is not seen; the vertical-centre button is inferred.
8. Check the comp is long enough for the countdown (said). Here the comp is 60 s (said; the ruler runs 0 to 1:00 in f000628).
9. Go to time 0, create a keyframe on Slider (said) and type 60 (said: values are in seconds, 60 = one minute, 120 = two). The stopwatch icon is visible on f006995 but the click itself is not seen (inferred). Press U to reveal the keyframes (said). Key shown at the start f006995 (diamond at left edge of the timeline).
   - Slider at 0:00: 60.00 (shown f006995)
10. Move to the last frame of the comp (0:00:59:29 shown f006763) and set Slider to 0 (said); a second key appears at the right end (shown f006995). The linear / default interpolation is not changed (inferred; no ease is touched).
   - Slider at end: 0.00 (said; value 0.00 shown in the timeline "New values")
11. Play: the clock counts 01:00 down to 00:00 (said). Frames showing it playing: f006995 (00:59), f007304 (00:57), f007392 (00:55).

layout: 
- Text block width about 30% of the picture width (measured f007392: 434 of 1439 px), digit height about 13.6% of the picture height (110 of 811 px); at 1920x1080 that is roughly 580 px wide and 147 px tall digits (inferred from those shares); this ties to the 200 px Montserrat Black setting (f001045), whose digits are about 0.7 em. Centred both ways, block centre at 50% / 50% (measured f007392). Digits are tabular enough that the block width is the same at 00:57 and 00:59 within a pixel or two (f006995 vs f007304).
- Colon is the same weight as the digits and sits slightly closer to the right pair; characters are tightly spaced (the digits nearly touch) (shown f007392).
- Flat white (255) on flat black, no shadow, glow, grain or background shading (shown f007392).
- The result is the author's own build: the same layer as built in the steps, not a separate finished file. The Align step moved the block upward-to-centre (it sits near y 47% before step 7, f004081, and at 50% after, f006763).
- Motion: only the digits change; nothing slides or fades. Value drops one whole second each comp second (slider 60 over 59:29 → about 1 per second). Linear key interpolation is inferred.

timing and easing: Two keys on Slider: 60 at the first frame, 0 at the last frame of a 60 s comp at 30 fps. No easing given. One displayed second per comp second (inferred from the two keys and the rounding).
variations: Slider values are in seconds, so another length is just a different start value (said: 120 = two minutes); keep the comp at least as long as the countdown (said).
pitfalls: If the expression errors, switch the Expressions Engine to Legacy ExtendScript (said); the code's one-line `if ... else` without a semicolon is the likely cause (inferred, see extras). Make the comp long enough for the countdown (said).
longest on: The expression paste and the engine fix: about 0:25–1:00 (frames f001480–f003529, about 34 s of the 125 s video, from the timeline's frame names); the keyframing at the end took about 20 s (f005573–f006763).
build notes: Create a text layer ("0"), add ADBE Slider Control (effect name "Slider Control", property "Slider"), set sourceText.expression to the pasted code (quote it exactly). Set project expressions engine to Legacy ExtendScript by hand (File > Project Settings > Expressions; scripting: app.project.expressionEngine = "extendscript" is inferred, check on build). Keyframe the Slider: setValueAtTime(0, 60) and setValueAtTime(compDuration - 1/30, 0) (inferred end key frame). Centre with the Align panel (Composition), which works from the layer bounds. On screen the anchor sits at the bottom-centre of the text, about the baseline (f004081: anchor y 424 under digits spanning 343–424, f006763); nothing on screen sets a position value, so do not assume the anchor is at the text's middle. Text: Montserrat Black 200 px, leading 160 px, tracking 0 (f001045).
result: start=116.6 end=124.8 animated crop=631,131,1439,811 frame=f007392
before: f000628 (empty comp), f004081 (00:00 off-centre during alignment)
unknowns: exact comp dimensions beyond the 1080 px height and 30 fps read in the timeline's Changed list (width 1920 inferred from the 16:9 picture); which Align button was clicked (only the vertical move is evidenced); whether keys were linear (default assumed); the preview ran slower than real time (about 70 comp frames across 5.2 s of recording), so no speed is taken from the video; how the end key was reached beyond the timecode 0:00:59:29 shown f006763.

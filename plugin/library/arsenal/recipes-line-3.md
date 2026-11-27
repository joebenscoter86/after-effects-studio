# Arsenal recipes: Line jobs: what the viewer must get from this line (part 3)

Generated from the recipe drafts; do not edit by hand. Recipes whose primary job is in this group. Find candidates for a beat with ae_arsenal find; read one with ae_arsenal get, or a section here by its heading.

## Typed-on note text that deletes and retypes, with word-by-word fade and a hold-key camera push
id: 09-typewriter-rewrite-text-effect
revision: 10edb078
job: make-concrete; support: reveal-headline, keep-it-alive
status: proven (accepted 2026-11-26)
what it does for a beat: Reach for it when a fake notes or chat window needs its text to appear as if someone is writing it, changing their mind and retyping, and then the shot needs a little extra life so the held text is not static.
what it looks like: Inside a pale rounded card with a heading, two short lines of dark sans-serif regular-weight text (a title line and one short sentence) are typed out letter by letter with a thin vertical bar cursor at the end. The typing runs forward, backs up almost to nothing, then runs forward again. The words also fade up one at a time on top of this; later the view pushes in and drifts using the card's parent null.

ingredients:
- Animation preset "Blinking Cursor Typewriter Console" — stock (ships in Effects & Presets, folder Text > Animate In; the search box reads "type") (shown)
- Text layer converted to paragraph text — built-in (said; menu path inferred)
- Text animator Opacity with a Range Selector (Advanced > Based On: Words) — built-in (shown)
- Hold keyframes (right-click > Toggle Hold Keyframe) — built-in (said; menu inferred)
- Easy Ease (F9) and Graph Editor — built-in (said)
- Null layer driving Position and Scale (the card's parent chain ends at a null) — built-in (said, shown)

steps:
1. Make the dummy copy: a title line, on the next line, a short sentence. The narrator generated filler text. The narrator first says to make the video-script title bold (about 35:56), and later says the bottom text needs to be regular (about 37:29). Both lines end up regular weight (shown, character panel on Regular, both lines regular). Both lines look bold in the early preview, which is only the building state. (said / shown)
   - The text must be a paragraph (box) text, left aligned, not a point-text layer (said)
   - Font: SF Pro; weight Bold while building, Regular in the finished picture (shown)
   - Size: 77.5 px at layer scale 46.3 % is a layer value (shown); the text sits under a parent chain (a shape layer at 72 %, and nulls above), so it is not an on-screen size. Aim for capitals about 1.9 % and ascenders (b, l) about 2.2 % of the picture height (measured at full size, picture 1080 px high: capitals about 20 px, ascenders about 24 px).
2. Cut the sentence short: the author selects the tail "how important hooks are" and removes it, so the line reads "This video will be about" and the layer's name shortens the same way (and every later frame). The typed result has that short sentence only. (shown)
3. Apply the preset to the text layer with the layer selected. (shown : effect stack on the layer holds Animation, Cursor On/Off, Cursor Shape, Cursor Blink Speed)
   - Animation (slider): drives how much text is typed, 0 to 100 (shown)
   - Cursor On/Off: checked (shown)
   - Cursor Shape: Vertical Bar (shown)
   - Cursor Blink Speed: 4.00 (shown)
4. Open the layer's keyframes (U) and parent the layer to the card's shape layer (the layer the other card elements follow). (said)
5. Retime the slider keys so typing starts after the card has appeared; the narrator only says to move the end of the typing to "around here" on the timeline and gives no duration. (said, no numbers)
   - The preset's own slider keys sit at about 7.2 s and 8.4 s on the 25 fps timeline at first (shown, keys at 1436 and 1598 px; 128 px per second, 07s tick at 1414); first key value not read, last key 100; the author moves them (said)
6. Make the typing go back and forth: add more slider keys so the value runs up to 100, falls back to a low value, then climbs to 100 again. (said "go back and forth a few times"; key values inferred from the preview)
   - In the slider reads 64.00 with a key selected and the playhead past the last slider key: a held value in the middle of an edit, not a value on a run up. Typed text reads "This video will be about|" and "This video|" in alternating preview frames (shown). Backing up reaches an empty line in one preview frame (crop, where the heading is gone too, so the typewriter covers both lines) — inferred it goes back almost to zero. Values of the middle keys are not given.
7. With the text layer selected: Animate > Opacity (Add Animator). (said)
   - Opacity of that animator: 50 % (said). Not read on screen, so left under unknowns.
   - Range Selector 1 > Advanced > Based On: Words (said; shown, dropdown open, then Words)
   - Range Selector Mode Add, Amount 100 %, Shape Square, Smoothness 100 %, Ease High 0 %, Ease Low 0 % (shown — defaults)
8. Animate Range Selector Start: key at 0 % early on the layer (said "set a keyframe for start"), then a later key a bit further on so the words fade in one by one (said "go a bit further and then fade it in"). The later value is not said or shown. Start shown as 0 % at about 7:05 with a second key about 0.64 s later (shown, keys at 980 and 1021 px, 64 px per second).
   - Only this animator is shown. A slider reading 53.12 shows briefly while dragging, a pass-through value (timeline note)
9. Tidy and ease the keys: select them, press F9, open the Graph Editor and pull the handles for a stronger ease. (said)
10. Trim the layer so the blinking cursor is not visible before the typing starts: put the playhead where typing begins and press Alt+[ (said "alt left bracket"). (said; layer's start moved to about 7:05, shown where its bar starts at about x 980)
11. Move the text block a bit better into place (the narrator aligns it and moves it a bit further down, about 37:41–37:48) before keying the push; amounts not given. (said) Then give the held scene movement. Select the top-level null and key Position and Scale on it. The stack is: the card's shape layers parent to "Null 1" (layer 23); Null 1 is itself parented to "Null 2" (layer 22, Parent: None, shown). Null 2 is the root and the keyed one; Null 1 is its child and carries no keys. (said; shown)
   - First key, at the playhead's time of about 10:05 comp time: Scale 300 %, Position 1920, 770 (shown; layer Opacity 0 % on this null)
   - One frame later: Scale 472 %, Position 2487.6, 1195.2 (shown at 10:06)
   - A later key a little further on: Position 2379.6, 1195.2 – a small drift of about 108 px left (shown at 11:04; only Position is keyed there, Scale 472 % is a held value); "not too much" (said)
   - The author deletes and redoes the push keys at about 38:36–38:44; the recipe shows the redone state and the source range ends.
   - Make the first keys hold keys (said); the move is a cut to the close framing, then the drift
12. Drag the keys left, so the push starts where the text movement ends (said). The keys' final times are not given. (shows the first key dragged to ~9.5 s while time display reads 11:04.)

layout: All measured on small frames where the picture is 960 x 540 (picture x 301–1261, y 141–681).
- Card : 65 % of picture width, 81 % of its height, left edge 17 % in from left, top 9 % down; large corner radius (about 5 % of width) measured.
- Heading "Notes": left edge 21.9 % across, baseline at about 24 % down (22 % is its centre); cap height about 4.5 % of picture height. Measured.
- Typed block: left edge 21.9 % (same as heading), first line centre 31 % down, second line centre 35.5 % down, line spacing 4.4 % of picture height; capitals about 1.9 % and ascenders about 2.2 % of height. The finished regular-weight sentence "This video will be about" runs small-frame x 510–698 of the picture's 301–1261, about 19.5 % of picture width (measured); the bold building state is wider, x 510–718, about 21.7 %. Box wide enough not to wrap. Measured.
- Title text in dark near-black, body in dark grey (regular); cursor: thin vertical bar, dark core 2 px wide on the 3840 frame (about 4 px at half darkness once blurred by the recording) of the same colour directly after the last letter (shown crop/ crop). Cursor extent (measured on full-size, picture 1080 px high, cursor in its on phase): about 34 px tall = 3.1 % of picture height, from about 2 px above the ascender top (y 653) to about 8 px below the baseline (y 677), so it is about 1.4 x the ascender height (24 px) and about 1.7 x the capital height (20 px); overhang under the baseline about 8 px (0.4 of capital height). Taller than the letters, set directly against the last letter. It is Cursor Shape Vertical Bar, shown; the preset sets the height, no size control appears in the effect stack. In the cursor is in its off phase, so that frame shows none.
- Colours: card white on a light grey ground, three traffic-light dots top left (red, yellow, green), 1.5 % of picture width each. Result of the card is not produced by this tip; it is the card from earlier tips (the neighbouring recipes in this video).
- Word fade: during the preview, individual letters/words render lighter grey and fade up (crops show half-faded "Scr" next to solid "Video"). The heading "Notes" also looks half-faded in those crops; its animator is not shown, so how it fades is unknown.
- Final push : comp view is 472 % null scale, the card fills about 1.3 x the picture width; text sentence width 30.7 % of picture width in that framing. At 300 % scale the card is 65 % wide, similar to the first framing.
- Motion: typing speed is not measurable from the recording (preview speed varies). The drift is 108 px left (comp units) over the keys' span.

timing and easing: Typing: slider keys retimed by hand; Easy Ease (F9) then more easing in the Graph Editor on the Range Selector keys, handle values not shown. Hold keys on the first null keys, then free keys for the drift. Keys' exact seconds not shown; only the preset's original two slider keys (about 7.2 s and 8.4 s) are readable.
variations: Cursor Shape can be changed from Vertical Bar in the effect (menu seen in the effect stack); blink speed is a slider. Opacity animator can be Characters rather than Words (the dropdown also offers Characters, Characters Excluding Spaces, Lines; shown).
pitfalls: The text must be paragraph text, not point text, and the typing text layer must be cut off with Alt+[ so no cursor shows before it starts (said). First keys of the camera push must be hold keys or it looks odd (said).
build notes: Add the preset by selecting the text layer and double-clicking it in Effects & Presets (Animation Presets > Text > Animate In). Effect names appear as "Animation", "Cursor On/Off", "Cursor Shape", "Cursor Blink Speed" (preset-created expression controls, so they cannot be added by name from the Effects menu). Text animator: Text > Animator > Opacity; Range Selector Advanced > Based On = Words; key Start 0 to 100 %. Null: add a null, link the card's parent chain to it, key Position and Scale with setInterpolationTypeAtKey(HOLD) for the first keys. Cursor preset must be applied by hand or the preset file loaded with applyPreset.
unknowns: Opacity animator's own value on the final result (said 50 %, not read on screen); slider key values apart from the last (100); the later Range Selector Start value; the heading's own animation; how far the text block was moved; the null's second key times; the preset's file name beyond what Effects & Presets shows; ease handle values; font colours; the final picture after the push is a different framing from the first and plays no typing on screen in this stretch. The result crop shows both lines bold (building state, before the switch to Regular); the finished weight is regular.

## Second notification arrives and the first one is pushed back
id: 05-stacked-second-notification-with-push-back
revision: 626d0c64
job: list-items; support: add-depth, add-impact
status: proven (accepted 2026-11-26)
what it does for a beat: Use it when a second card lands on top of a card already on screen and the first should react: sink, shrink and settle with a small springy wobble instead of just being covered.
what it looks like: A wide frosted pill card sits centred on a near-white ground. A copy drops in from above and lands on top at the same spot with a soft bounce, while the original slides down behind it, a little smaller, its lower part peeking out under the new card. The new card's glass blurs what lies behind it.

ingredients:
- Finished notification build (a group of shape, text and logo layers, all parented to a chain of null layers ending in one top "main" null) — built earlier in the video, not part of this technique
- Duplicate layers (select all, duplicate, move copies to top of the stack, slide them later in time) — built-in; shortcut Ctrl+D said; menu path inferred (Edit > Duplicate)
- Position and Scale keyframes on the first notification's main null — built-in
- Bounce expression on both Position and Scale — stock; text supplied in the video description; used unchanged (said (description))

steps:
1. Select every layer of the finished notification and duplicate them (said, including the Ctrl+D shortcut; the Edit > Duplicate menu path is inferred, no menu is on screen).
2. Move the duplicated set to the very top of the layer stack (said). Layer list shows the copies ("… 2" names) above the originals (shown).
3. Slide the duplicated layers later in time by 15 to 20 frames (said). Their bars start at about frame 15 on the ruler (shown, bars start under the playhead at 0:00:00:15; measured from the ruler, ≈ frame 15).
   - Result: the copy repeats the original's entrance, including its bounce, from that moment (inferred from the finished clip; frames 15919–15922 were cut from the source video, not kept frames). The copy's entrance is the one built in 03-expression-bounce-drop-in and 04-staggered-element-offsets: start 150 px above rest and at 60 % scale, 4 frames to rest, bounce expression amp 0.04, freq 1.8, decay 3; logo parts start 2 frames and text parts 4 frames after the card, so the copy's parts arrive one after another (at 15919 the logo is in while the card's text is still missing).
4. Select the first notification's main null (the null at the top of its parent chain, with no parent itself — shown, parent column "None") and add Position and Scale keyframes (said). First keys are set where the playhead stands, at time 15, with Position 960,540 and Scale 100,100 (shown).
5. Paste the bounce expression onto both Position and Scale of that null (said). The values go red, which marks an expression (shown). Expression used is the one from the description, with amp 0.04, freq 1.8, decay 3, time_max 3 (said (description)). Full text, word for word (said (description)):
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
6. Move the first key (and its Scale partner) from frame 15 back to about frame 13, two frames before the copy starts (said); the diamonds then sit at about 13 (inferred from diamond x position against the ruler). The 15 in step 4 is only where the keys were first made.
7. Go about five frames on and lower both values slightly (said). The second key's time reads frame 19 on the time display (shown), so the span is about 6 frames from key one by measure; the narrator's "five" is rounded.
   - Position (second key): Y first read 617, then 636, 652 along the way (617 and 636 read from the timeline panel text; 652 shown) and finished at 960, 676 (shown — panel reads 960.0,676.0).
   - Scale (second key): 86 % passed through (shown), 90 % at the end (shown — 90.0,90.0 %).
8. Preview. The original now sinks 136 px and shrinks to 90 % over about 6 frames as the copy arrives, then wobbles, while the copy carries its own bounce (seen in the finished clip, frames 15918–15930 cut from the source video).

layout: (all measured on the finished clip frames and a 9-frame sheet 15890–15970; the clip fills the whole 1920×1080 picture and the card sizes match the editor view at 100 % scale, so one is the other)
- Front (new) card: about 70 % of picture width (≈1350 px), about 29 % of picture height (≈315 px), a fully rounded pill; centred at x 50 %, y 50 % of the picture. measured
- Back (first) card: about 90 % of the front card in each direction (≈1215 × 283 px), centred about 12.5 % of picture height (≈135 px) below the front card's centre, i.e. at y ≈ 62.4 %. This matches the typed key (540 → 676, scale 90 %). measured
- Overlap: front card hides the back card's upper part; about 10.8 % of picture height (≈117 px) of the back card shows below the front card. The back card's logo and text peek out under the front edge: its second line of text is sharp there, its logo only partly visible. measured
- The front card's glass blurs whatever sits behind it: the back card's logo shows through as a soft teal blob inside the front card's lower-left, and its text as dark smudges. measured. The blur is the card build of 01-frosted-glass-pill-from-adjustment-shape, which the copy's cards carry: the front card is an adjustment-layer pill with Fast Box Blur, Blur Radius 30, 3 iterations (said and shown in recipe 01), set for a card 1350 × 315 px (radius ≈ 2.2 % of the card width, 9.5 % of its height), with a 4 px CCCCCC outline and a 5 % black 'depth' pill under it, which gives the faint shading rim. Recipe 01's figures apply here; this clip's ground reads 247.
- Both cards have a thin pale outline and very light shading; ground is near white, slightly grey (about 247 in the clip; the editor's own white picture is brighter). The shadow under each card is faint. measured by eye only.
- Which objects carry it: only the first notification's top null is keyed; every layer of the first card follows it through parenting, so card, text and logo move and scale together (shown, parent column). The copy's layers carry the original's bounce unchanged.
- Motion blur: the arriving copy and the sinking original are both streaked vertically in the clip (frames 15919–15922 cut from the source video). At 15921 the arriving card's small text is stretched to about 2 line heights (≈ 25–30 px of smear on glyphs ≈ 35 px tall, at 1920 wide) and card edges are doubled; the smear is vertical only. measured. Cause: not said or shown (no motion-blur switch is on screen in this technique). A smear along the direction of travel that fades as the cards settle is what the comp Motion Blur gives, not the glass box blur, so layer Motion Blur switches (plus the comp switch) are the likely cause: inferred. Card travel between clip frames 15920 and 15921 is ≈ 55 px; with smear ≈ 25–30 px the implied shutter is about 180–200° (smear ≈ speed × angle ÷ 360), matching the default 180°; inferred, as clip frame spacing against comp frames is unknown. Gone by 15930.
- Direction: the copy enters from above (a faint card sits above centre at its start, shown, at y ≈ 275 of the editor's picture, i.e. ≈ 27 % of height from the top) and ends at the centre; the first card moves straight down, no sideways drift. At the new card is a blurred smear above the older one, so it arrives with a blur. (the copy's own entrance is built earlier in the video; only its look at arrival is given here).
- Motion size: first card moves 136 px down and loses 10 % scale. Bounce size from the expression: peak speed on Position over the 6 frames is ≈ 23 px per frame (680 px/s), so the first overshoot is ≈ 0.04 × 680 ≈ 27 px, decaying with e^(−3t) at 1.8 cycles per second; on Scale the initial wobble is ≈ 0.04 × 50 %/s ≈ 2 percentage points. (inferred from the pasted expression and the keys; not measured on the clip.)
- Overshoot read in the clip: the front card measured 68 % wide (settling) and 70.4 % (rest). measured. Source frames also read ≈ 75 % at 15924 and ≈ 71 % at 15930, so the front card overshoots to about 75 % before shrinking back to 70.4 %; it does not only settle from below.
- Result is the pre-made finished clip at the end, not the build just watched: it zooms to full screen and the build's panels are gone; the keys in the build (676, 90 %) match the clip's measured offset and size, so they appear the same.

timing and easing: Copy starts at about frame 15 (shown). First key about frame 13 (inferred), second key frame 19 (shown). Keys look like plain diamonds (linear) in the panel (shown), no easing change is mentioned or shown; the springy feel comes from the expression: amp 0.04, freq 1.8, decay 3, time_max 3 (said (description)). In the clip the copy's blur-in and the sink play over roughly the same half second at preview speed (not timed; preview speed unknown).
variations: The narrator says the timing and values can be refined further (said).
pitfalls: none given, apart from the need to start the first card's keys a couple of frames before the copy starts so the reaction is not late (said).
build notes: In a script: duplicate all layers, set the duplicates' startTime +15 frames (0.5 s at 30 fps), put them above the originals. On the main null: setValueAtTime(13/30, [960,540]) and (19/30, [960,676]) for Position; Scale [100,100] and [90,90] at the same times; then set both properties' expression to the full text quoted in step 5, verbatim (including the easeOut factor). Turn on the comp's Motion Blur switch and the layers' switches (inferred, shutter about 180–200°). Keep the expression's `velocityAtTime(key(n).time - thisComp.frameDuration/10)` — it reads the move into the key. Keys are plain linear (inferred from diamond shape). Scale keys on a null need the link-dimensions switch on (the chain icon shows linked). If the cards are built differently from the original, 676 px is 12.5 % of a 1080 high comp: scale it to the card height (136 ≈ 0.43 × card height 315).
  - Played window source seconds 530.3–531.2 (frames 15910–15935): full-screen picture, no overlay, the new card arrives and the first one sinks. Still reference: 531.3–532.5 (frames 15940–15975) holds the same layout; use (clean, no arrow or handles). The kept frame is blank, so the clip fades or cuts at ≈ 532.7. The comp's time display is not visible in the clip, so frames per redraw are not counted.
unknowns: Exact first key time (13 is read from a diamond's position). Whether the narrator's "five frames" or the display's 19 is intended. Key interpolation type (looks linear). Whether Motion Blur switches are on (inferred only) and the exact shutter. Shadow darkness. Preview speed of the clip. The copy's entrance start position beyond a rough 27 % of height.

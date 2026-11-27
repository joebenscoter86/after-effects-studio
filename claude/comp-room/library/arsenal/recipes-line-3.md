# Arsenal recipes: Line jobs: what the viewer must get from this line (part 3)

Generated from the recipe drafts; do not edit by hand. Recipes whose primary job is in this group. Find candidates for a beat with ae_arsenal find; read one with ae_arsenal get, or a section here by its heading.

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

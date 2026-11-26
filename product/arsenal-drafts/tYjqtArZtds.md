# Techniques from one video (5 recipes, all unproven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none is in the plugin. `status: proven` means it was built in After Effects from the recipe alone, compared with the tutorial's own result, and accepted by Joe (0 of 5); `status: unproven` means it has not been.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round | Status |
|---|---|---|---|---|
| 01 | Frosted-glass pill built from three stacked shape layers | depth and finish; lines and shapes; glow and colour | 4 | unproven |
| 02 | Null hierarchy: three group nulls under one master null | workflow; layout and repetition | 2 | unproven |
| 03 | Two-key drop-in that settles with an expression bounce | energy and impact; workflow | 5 | unproven |
| 04 | Offset the logo and text groups a few frames behind the card | energy and impact; layout and repetition | 5 | unproven |
| 05 | Second notification arrives and the first one is pushed back | energy and impact; layout and repetition; depth and finish | 3 | unproven |

## Frosted-glass pill built from three stacked shape layers
id: 01-frosted-glass-pill-from-adjustment-shape
status: unproven
variant of: 05-glass-bar-refraction (201iywIy74c #5)
differs: Shared: a rounded-rectangle shape layer switched into an adjustment layer (parent step 10) with Fast Box Blur on it (parent step 11), over a stack of same-size pill copies, so the pill blurs what lies behind it. Here the pill is 1350 x 315 with Roundness 110; in the parent the Bar is 369 x 130 with Roundness 158 (parent step 6, comp size not given). Here Fast Box Blur Blur Radius is 30 with defaults and is the only effect; in the parent the Bar blurs at 9.1 and adds Exposure 0.50 and a Displacement Map (parent steps 11-12), and this recipe has no Exposure or Displacement Map. Here the two copies stay visible and plain: "Depth" is a black pill at 5 % opacity and "Stroke" is a 4 px CCCCCC outline with no fill; in the parent the one copy, Edge, carries an Inner Glow of Size 34.0, has its eye turned off, and only feeds the Displacement Map (parent steps 9-10 and 12). Here the ground is the comp's own flat near-white Background Color so the blur is not visible; in the parent the ground is black with a spinning, blurred, Wave Warped gradient star (parent steps 1-5). Here nothing is animated (still); the parent keys Bar Size X narrow to wide (parent step 8, key times unknown). Here a Null is added at the end for parenting; the parent's section has no null. In both the rim is inferred, not shown as a cause: here the blurred edge of the 5 % Depth pill, in the parent the displaced Inner Glow of Edge (parent layout).
source: tYjqtArZtds 21–158 s
jobs: depth and finish; lines and shapes; glow and colour
what it does for a beat: Reach for it when a card, banner or notification has to sit in front of a busy picture and look like frosted glass: it blurs whatever is behind it and gets a faint tint and a thin light outline. It is the base card that later techniques animate.
what it looks like: A wide pill with fully round ends, a pale grey body slightly darker than the near-white ground, a thin light-grey outline, and a soft lighter rim just inside the outline. The ground behind it is flat, so the blur itself cannot be seen in this example; only its edge effect shows.

ingredients:
- Comp Background Color (Composition Settings) — built-in; shown f000582, f000623
- Rectangle tool / Rectangle Path (Size, Roundness) — built-in; shown f001631
- Shape layer Fill and Stroke — built-in; shown f001033, f003408
- Adjustment Layer switch on a shape layer — built-in; shown f004116 (icon lit on the layer row)
- Fast Box Blur — stock; found by typing "box" in the Effects & Presets search (shown f004116; the narrator's word is "fastbox blur", the screen reads Fast Box Blur)
- Null object — built-in (made at the end of the segment, shown f004797)

steps:
1. Make a 1920 x 1080 comp at 30 fps, 5 s (shown f000623 in Composition Settings; 5 s also f001631). Set the comp's own Background Color in Composition Settings (no ground layer is made): the dialog reads 000000 black before (shown f000530), then FFFFFF is typed/picked (shown f000582, cursor still on the picker, so not proven final), and the settings swatch returns labelled "White" (shown f000623). The narrator asks for solid white or a very subtle grey (said). The rendered ground measures 250/250/250 (measured f004762); the swatch looks slightly off-white, so the final typed value is unknown.
2. Draw a rectangle with the Rectangle tool in the comp; it starts with a black fill and a purple-blue 11 px stroke (shown f001033).
   - Rectangle Path > Size: 1350 x 315 (shown f001631). The narrator says "350" and the first typed value is 290 (shown f001033); the screen's final value is 315, so the screen wins.
   - Rectangle Path > Roundness: 110 (said; shown f001631). Larger than half the height, so the ends become full half-circles (radius = half the height, 157.5 px).
3. Rename the shape layer to "Notification", centre it in the comp with the Align panel (Align Layers to: Composition) (said; Align panel shown f001033). (inferred: centred both ways, as its centre sits on the picture's centre at f004762.)
4. Move the anchor point to the shape's centre with Ctrl+Alt+Home (said; shortcut itself not on screen).
5. Set Stroke to 0 px on the layer (said; shown f002447 toolbar "0 px").
6. Duplicate the layer twice. Rename the lower duplicate "Depth" and the upper one "Stroke" (said; names shown f002922). Final order top to bottom: Stroke, Notification, Depth (shown f003672).
7. On "Stroke": remove the fill, give it a visible stroke colour and 4 px width (said; "4 px" shown f003408). At this point the colour is only a first visible one (a dialog reading 5C5C5C while being dragged, f003408, not final); the brighten to CCCCCC comes later, after the blur (step 11). Stroke on "Notification" and "Depth" stays 0 px.
   - Stroke colour at this step: first visible colour, e.g. 5C5C5C (shown f003408 while dragged; not final)
   - Stroke width: 4 px (said; shown f003408)
8. Select "Notification" and switch it into an adjustment layer (said; lit icon shown f004116). It now filters whatever is below it (said); that it only filters inside the shape's outline is inferred.
9. Select "Depth" and set Opacity to 5 % (said; shown f004116, row "Opacity 5 %"). Its fill stays black, so it reads as a very light grey tint.
10. Apply Fast Box Blur to "Notification" (shown f004201, f004318).
    - Blur Radius: 30 (said; shown f004318)
    - Iterations: 3 (shown f004318, default)
    - Blur Dimensions: Horizontal and Vertical (shown f004318, default)
    - Repeat Edge Pixels: off (shown f004318, default). (Inferred, not said or shown as a cause: the soft rim in layout is most likely the blur of the 5 % Depth pill's edge reaching the lighter ground inside the adjustment area.)
11. Last stroke change: on "Stroke" set the colour to CCCCCC (shown f004609, dialog at 0.8/0.8/0.8, cursor on OK; narrated at 2:21). Then add a Null above the stack to later drive the shape layers (said; null shown f004797). Parenting is the next technique.

layout: Picture means the 1920 x 1080 comp. Pill path is 1350 x 315 (steps); the 4 px outline is centred on that path, so its outer edge sits about 2 px outside it, about 1354 x 319 on paper, measured 1352 x 316 (within error at half scale). Outer edge as measured ( of the outline measured 1352 x 316 px at comp scale from 676 x 158 on the frame's 960 x 540 picture), so about 70.4 % of the picture width and 29.3 % of its height, centred (centre at 960, 540). Ends are full half-circles, radius about 158 px, which is half the pill's height or 11.7 % of its width. Outline about 4 px (0.3 % of the pill's width), colour CCCCCC typed, rendering about 202/255 at its darkest because it is anti-aliased and thin (measured f004762). Body: the ground is 250 and the pill's flat centre measures 236, i.e. a 5 % black layer over the ground (250 x 0.95 = 237.5 on paper; measured 236). Soft rim: inside the outline the body is lighter, from about 242 at the edge down to 236 over about 20 frame px to reach 237 (about 40 comp px, roughly 12 % of the pill's height; 244 to 237 over about 18 px at the top), and 236 only after about 44 frame px on all four sides, equal at the ends and top and bottom (measured, f004762). Inferred: the rim is the blurred edge of the 5 % Depth pill, reaching the lighter ground inside the adjustment area (the 250 outside to 236 centre gradient). The blur is not visible as a blur of a picture since the ground is flat. No drop shadow, no glow, no grain. The ground is the comp background colour, flat 250 grey across the whole frame. Objects carrying the effect: one pill (three layers stacked at the same size and position). The null and any text or logo come later; the result frame has none of them.
timing and easing: none given (a still).
variations: The narrator says the ground can be white or a very light grey and that the outline colour can be anything visible that you then brighten. Values after that are described as adjustable but no ranges given.
pitfalls: none given.
longest on: Roughly equal parts, about 28 to 30 s each (timed from the sentence times): sizing and rounding the rectangle (27 to 55 s), renaming and centring it (55 to 84 s), making the Depth and Stroke copies (84 to 114 s), and the adjustment-layer, opacity, blur and stroke colour steps (114 to 142 s). The stroke colour dialog is opened twice (about 8 s and 5 s on screen, f003169–f003408 and f004555–f004710), which is the most repeated step.
build notes: Layer names Notification, Depth, Stroke are labels used here, not required. Shape layer with Contents > Rectangle 1 > Rectangle Path 1 (Size, Roundness), Fill 1, Stroke 1. Duplicate with Ctrl+D. Adjustment Layer is the layer switch in the layer's switch column (layer.adjustmentLayer = true by script). Effect: "Fast Box Blur" with Blur Radius, Iterations, Blur Dimensions, Repeat Edge Pixels (match name likely ADBE Box Blur2, not confirmed). Ctrl+Alt+Home is "Pan Behind"; the Align panel and anchor moves are by hand. Fill removal on Stroke layer: delete the Fill 1 group.
result: start=156.9 end=158.7 still crop=555,131,960,540 frame=f004718
before: f001033
unknowns: Comp background colour's final typed value (the shown picture is 250/250/250). Whether Depth's fill was left black (it appears so, shown f001033 default black fill, not re-confirmed). Why the example uses Fast Box Blur 30 over a flat ground; a busy backdrop is not shown in this technique. Exact corner position values for the centring align (only the result is shown).

## Null hierarchy: three group nulls under one master null
id: 02-null-hierarchy-for-grouped-motion
status: unproven
source: tYjqtArZtds 161.2–266.7 s (the technique's own span ends at 256.0 s; the last cited frame, f008000 at 266.7 s, shows the finished chains)
jobs: workflow; layout and repetition
what it does for a beat: Reach for it before animating a card made of many layers (shapes, text, logo). Each part-group gets its own null, and one master null sits above them, so the whole card or any single group moves with one layer.
what it looks like: Nothing visible changes. A wide, pale, rounded notification card on a near-white ground shows a round mint logo on the left, a bold name with a grey message line under it, and a small grey "NOW" at the top right. Only the layer stack (parent column) records the technique.

ingredients:
- Null Object layer — built-in; Layer > New > Null Object (inferred; the menu is not shown, only the new null "Null 1" appears, f004837)
- Parent & Link column (pick whip or drop-down) — built-in; shown in the timeline, f005726
- Text layers, imported logo image — built-in (the example's content, any will do)

steps:
1. Start from a finished card made of three shape layers (a depth/shadow copy, the main card, an outline copy), in a 16:9 comp with a pale ground. (shown f004837)
2. Add a null and rename it as the shapes' controller. It lands on top of the stack. (said; shown f004837 with the name field open, f005135 renamed "Null Notification")
3. Select the three shape layers and parent them to that null (said). The parent column of all three reads the null (shown f005726: "5. Null Notific" on Stroke, Notification, Depth).
   - Parent: the shape-controller null (shown f005726)
4. Import the logo image and place it at the left end of the card; add the text layers and arrange them. (said that the logo is placed and the text arranged; shown f005726 for the layers; the side is shown only: the narration says "right side", but every frame from f005726 on (f007423, f008000) has the logo at the LEFT, so the screen wins)
   - Logo: left end of the card, round mint badge (shown f007423; the narration's "right" disagrees)
   - Text: name above, message below, both left-aligned beside the logo, "NOW" at upper right (shown f007423)
   - The imported image layer still reads "[Artboa… copy.png]" at f006081 and reads "Logo" from f007067: the author renamed it in between, with no word about it (shown f006081, f007067). Later steps use the name "Logo".
5. Add a second null, rename it "Text Null", and parent all three text layers to it. (said; shown f006170 for the name being typed and the three text layers reading "1. Null 2"; f007067 shows the finished name "Text Null" with text layers "1. Text Null")
   - Text layer colours were changed to mark them in the timeline (said; layer label colour shifts from red to blue, f007067). Cosmetic only.
6. Add a third null, rename it "Logo Null", and parent the logo layer to it (said; shown f007067 renaming "Logo Nu…", f007423 logo parent "5. Logo Null").
7. Add a fourth null and parent the three nulls (shape controller, Text Null, Logo Null) to it; the narration calls it "main", but it still reads "[Null 4]" at f008000, so the name is said, not shown. (said; shown f008000)
   - Chains at f008000 (shown): Text Null → 1. Null 4; Logo Null → 1. Null 4; the shape-controller null → 1. Null 4. Then the three text layers → 2. Text Null; Logo → 6. Logo Null; Stroke, Notification, Depth → 8. Null Notific[ation]. Null 4 → None.
   - At f007582 the three nulls still read parent None and Null 4 exists; by f008000 they are parented, so the parenting happens between 252.7 and 266.7 s (shown).
8. Copy the bounce expression from the description, and add a Position keyframe on the shape-controller null (said). The key is at time 0 with value 0,0 (shown f008000: Position 0.0, 0.0 with the stopwatch on, tooltip 0:00:00:00 • 0.0, 0.0). Because this null is now a child of Null 4, 0,0 is a position relative to its parent, not to the comp. Its box (dashed square, anchor at its top-left corner) sits with that corner on the comp centre at f008000, which fits a parent whose own position is the comp centre (inferred: the parent's value is not on screen). Pasting the expression belongs to technique 03 (see extras.md: pasted at 302 s).

Final stack (top to bottom) at f008000: main null, Text Null, "NOW", name, message line, Logo Null, Logo, shape-controller null, Stroke, Notification, Depth (shown f008000). Chains: text layers → Text Null → main; Logo → Logo Null → main; Stroke/Notification/Depth → shape-controller null → main.

layout: Comp 1920×1080 shown at 50 % (the viewer's picture is at x 555–1515, y 131–671 of the full frame, measured). Frame short side = height. Measured on f007465 (a clean frame; the view is 50 %, so comp px = 2 × view px):
- Card outline: x 696–1373, y 321–480 of the frame, i.e. 1354 × 318 comp px: 70.5 % of the comp width, 29.4 % of the comp height (measured on the outline, stroke included), centred on the comp. It is a pill: end radius = half its height (about 159 comp px, 11.7 % of its width). It is wider than the 290 px Size shown in technique 01, so the card was resized between, or the outline adds to it; build to the measured 1354 × 318.
- Card look (measured): fill light grey about 236 (ground about 250, near-white), a soft darker inner edge, a thin grey outline about 2–3 view px wide (value 202–216 at the edge row) and a faint lighter halo outside it. These come from technique 01 (stroke, depth and blur layers); no step here makes them.
- Logo: mint round badge, diameter 94 view px = 188 comp px (17.4 % of the comp height, 59 % of the card height), vertically centred on the card; its left edge is 38 view px (5.6 % of card width) in from the card's left edge. Rendered badge colour about (182,250,237); the dark glyph inside about 54 view px wide. This is the example's imported artwork: a builder may use any round logo of this size.
- Text, all left-aligned with its left edge 163 view px (24 % of card width) in from the card's left edge: name, bold black, cap height about 26 view px (about 4.8 % of comp height; inferred font about 72 comp px); message line, regular mid-grey (about 150), cap height 21 view px (3.9 % of comp height; inferred font about 60 px); "NOW" at the upper right, regular light grey, cap height about 14 view px (inferred about 37–40 px; the Character panel at f007423 reads 37 px, grey, Regular on the selected layer, which fits this label). Name sits in the card's upper half and message below it; the two together are centred vertically on the card. Font in the panel: SF Pro Display (shown f007423; the description names SF Pro). Text content is the example's: the builder is free to pick words.
- Null boxes: default null size 100 × 100 comp px (50 view px = 5.2 % of comp width, 9.3 % of comp height), anchor at the top-left corner, which sits on the comp centre, so the box lies just below-right of the centre (x 1035–1085, y 401–451). Dashed null boxes are layer outlines, drawn by the editor, not rendered. Every kept frame from f007337 to f008189 shows this box inside the card, so no frame of the card is free of it; the clean sub-crop below avoids it.
- No shadows or animation belong to this technique: the picture is the same before and after parenting (comp time reads 0:00:00:00 throughout).
timing and easing: none given for the parenting itself. One Position key at the start (time 0) on the shape-controller null, shown f008000.
variations: Group different layers per null as the design needs (said in effect: shapes, text, logo each in its own null). Colour-label the layers to keep them apart (said).
pitfalls: none given. Order matters in practice: parent the child nulls only after each is named and filled (inferred).
longest on: Timed from the sentence starts, as single steps: parenting the shapes and adding the logo and text, 2:40.2–3:12.2 (about 32 s), is the longest; the logo-null step, 3:27.5–3:56.8 (about 29 s), is second; the main-null step, 3:56.8–4:17.0 (about 20 s), third; the text-null step, 3:12.2–3:27.5 (about 15 s), shortest. The next section starts at 4:17.0.
build notes: Script: comp.layers.addNull(); null.name = "..."; child.parent = null for each layer (set the parent after creating all nulls); main.parent not set; children of main: the three group nulls. Shape-layer parenting must keep world position (setting .parent in script keeps transform values, so the nulls should be at the comp centre or positions offset). The shown child position is 0,0 relative to its parent, so either leave the three group nulls at 0,0 under a main null placed at the comp centre, or keep them at the comp centre and leave the main null at 0,0; do not offset both (inferred: the parent's value is not on screen). The layer rename of the logo is cosmetic.
result: start=248.8 end=273.0 still crop=690,315,690,172 frame=f007465 (card and outline; the dashed null box at x 1035–1085 is inside it and cannot be avoided; checked identical at f007465, f008000 and f008189, comp time 0:00:00:00 held). Clean sub-crop with no null box, no mouse, no selection handles: crop=690,315,340,172 (logo and name, left end of the card) on f007465.
before: f004837 (shape layers only, Null 1 just added, name field open)
unknowns:
- The parent null's own Position, and any step where the author zeroed the child's Position: not on screen.
- Null layer size (100×100 default?) and which nulls were moved: not given.
- The exact new null colours/labels beyond red/blue: not given.
- The name "main" is said but the layer reads "Null 4" through f008000.
- Where in the stack each null was dragged: only visible in the layer order above.
- Stroke/Notification/Depth settings: from technique 01, not this video segment.

## Two-key drop-in that settles with an expression bounce
id: 03-expression-bounce-drop-in
status: unproven
variant of: 03-step-icons-pop-with-bounce-in-sequence (nHh0NRo8G2U #03)
differs: Shared: both Alt-click a stopwatch, paste an inertial-bounce expression (it reads the speed at the last key through nearestKey and velocityAtTime and adds a decaying sine, so the property overshoots and rings after its last key) and put it on Scale over two Scale keys, and both reach the other layers by copying the same expression (the parent step 5 copies it to the other five pictures; here step 8 repeats it on every remaining null). Differences: here the full expression is on screen only in part but its text is copied word for word from the description (amp .04, freq 1.8, decay 3, time_max 3, with a 3 s window); in the parent amp = .1 and freq = 2.0 are shown (f012940) and the rest, including decay 2.0 and a 1 s window (t < 1), is inferred by that recipe. Here the expression sits on Position as well as Scale; in the parent it is on Scale only (step 5). Here Position drops 150 comp px over 4 frames at 30 fps (the start key at 0.0, -150.0 shown f009039) and Scale runs 60 to 100 % (100 % inferred, the parent has 0 to full size); in the parent Scale grows 0 to full over 12 frames at 23.976 fps with the cubic-bezier 0.88, 0.14, 0.12, 0.86 ease, while here the keys are plain diamonds with no ease named. Here the keyed layers are nulls of a parent hierarchy (card, text group, logo), so the whole notification bounces as one; the parent keys the six picture layers directly and its steps name no parenting. Here nothing is staggered (no offset between nulls is given); the parent offsets each picture 10 frames after the last (step 6). Here the wobble is only computed from the expression and never played (the played stretch is the keys-only drop); the parent's bounce was measured on played frames (its layout lists overshoot about +2.5 % and settling within about 16 frames). Here the beat is a notification card with a logo and a title dropping in; the parent's is a row of process pictures under a phase bar.
merge: confirmed (carried from checks/03-before-proof.md; the variant of and differs lines are unchanged)
source: tYjqtArZtds 256.8–378 s
jobs: energy and impact; workflow
what it does for a beat: Reach for it when a card or group should drop into place and wobble a little before it rests, without hand-keying the overshoot. Two plain keys give the move; one pasted expression adds the settle on Position and on Scale.
what it looks like: A rounded card, at full size, starts above its final spot and drops straight down over four frames; with the expression on it would then ring up and down a few times with a shrinking wobble (computed, never played). The small start (60 %) is the later Scale key, not part of the played drop. The same treatment sits on every parent null (card, text group, logo), so the whole notification bounces as one. (In this window the viewer plays only the plain two-key drop, before the expression goes on; the wobble is never played, see result.)
ingredients:
- Null layers already parented as a hierarchy (see recipe 02-null-hierarchy-for-grouped-motion) — built-in
- Position and Scale keyframes — built-in
- Bounce expression on Position and on Scale (overshoot from the last key's velocity: amp 0.04, freq 1.8, decay 3, time_max 3) — pasted text from the video's description; the screen shows its first lines, `amp = .04;` (f011165) and the closing brace (f010510)
steps:
1. Copy the bounce expression from the description before starting (said; the description text is the source, said (description)).
2. Select the null that drives the card (the one the card's shape layers are parented to) and open Position. At the first frame set a key. (said; the Position stopwatch and the key at frame 0 are shown f008757)
3. Move forward four frames and set the second key there (said: four frames). The key sits about 4 frames after the start (shown f008757, diamond at the 4 f tick). The narration gives no value for it; leaving the null at its own value gives rest.
   - Position at the later key: 0.0, 0.0 (shown f008149 as the null's value before any key; inferred that this is what the key holds)
4. Back at frame 0, set the start Position above the rest point. (said "slightly above"; value shown f009039)
   - Position at frame 0: 0.0, -150.0 (shown f009039; -150 being typed f008757)
5. Alt-click the Position stopwatch to open the expression field and paste the expression. (said; the tooltip "Alt-click: add or remove expression" is shown f009039; the pasted result is shown f011165 as "Expression: Position")
   The expression text, word for word (said (description); the screen shows only its first line `amp = .04;` f011165 and the closing brace f010510):
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
6. Go to the start and open Scale. Key at frame 0, then four frames on, repeat the same process as Position. (said)
   - Scale at frame 0 on the card null: 60.0, 60.0 % (shown f010172 and f010510)
   - Scale at the 4 f key: not typed on screen for this null; full size (100 %) inferred
7. Alt-click the Scale stopwatch and paste the same expression. (said; "Expression: Scale" row shown f010510 and f011165)
8. Repeat position+scale keys and both expressions on every remaining null (text null, logo null). (said)
   - Logo null: start key at frame 0 is Position 0.0, -241.0 and Scale 84.0, 84.0 % (shown f011165: comp time reads 0:00:00:00, key diamonds at frame 0 and 4 f, and the viewer shows the logo about 120 px (viewer) / 240 comp px higher and smaller, about 78 px wide against 95 px at rest). At 84 % the logo also sits about 41 px (viewer) to the right of its rest spot; no step gives that, so it comes from the null's anchor/position and is not explained on screen.
   - Text null: Scale at frame 0 being typed to 80 with 100 beside it (shown f011352); position not read
   - The outer null (the parent of the three nulls, top row of the stack) is never keyed in this window; the narration says "remaining null layers" and the screen does not settle whether it gets keys or the expression.
layout: Comp 1920x1080 (the study video is 1920x1080); the viewer picture is 960x540 px in the full frame at x 555, y 131 (measured), so comp px = 2 × viewer px. Card at rest: 676 of 960 px wide (70 % of the picture width), 158 of 540 px tall (29 % of the height), centred dead on the picture (measured f008149: picture y 131–671, centre 401; card y 322–480, centre 401; x 697–1373, centre 1035 = picture centre). Corner radius at the ends about 55 px of the 159 px card height (about a third of the height, measured f008149), so it is a rounded rectangle, not a full half-height pill. In the played result window the card is the same width at its high start pose as at rest (676 of 960 px, measured at 294.0 s and 294.5 s): the played drop is position only, the card falling about 74 px of the 540 px picture (150 comp px) from the start pose. The 406 px wide pose (60 %, 42 % of the picture width) belongs to f010510, after the Scale keys, and is never played; it is not part of the result crop. Content on the card at rest (measured on f008852 crop): a teal round logo with a dark mark, about 95 px wide of 960 (10 % of the width, 17.6 % of the picture height), its centre about 23.5 % across and half way down; a bold title line starting about 32 % across and a grey subtitle line below it; a small grey "NOW" label at the top right, ending about 82 % across. The card look (pale grey body slightly darker than the near-white ground, thin light-grey outline, soft lighter rim just inside the outline, no visible blur because the ground is flat) comes from recipe 01-frosted-glass-pill-from-adjustment-shape; the shape's end rounding in this frame is about a third of the height as stated above. The logo, title, subtitle and NOW label come from the example's own artwork and text layers; the build here must supply them (a teal disc about 17.6 % of the picture height with a dark mark, black bold title about 5 % of the height, grey subtitle) to look like the frame. Only the card null is keyed when the drop plays (f008822–f008882): the logo and text sit at rest while the card drops, so the card passes behind them. Move size: Position starts 150 comp px above rest and falls over 4 frames. Overshoot (computed from the expression, inferred; the expression's velocity is per second): last-key velocity = 150 px in 4 frames = 1125 px/s; amplitude = 1125 × 0.04 = 45 px; first peak where tan(2π·1.8·t) = 2π·1.8/3, t ≈ 0.116 s, height ≈ 45 × 0.967 × 0.706 ≈ 30 px beyond rest (about 15 px in the 960 picture), then alternating with ring period 1/1.8 = 0.56 s, each half cycle about 0.43 of the one before, gone by about 2 s (time_max 3 s). Scale: 60→100 % in 4 frames = 300 %/s, amplitude 12 %, first peak about 8 % beyond the end value (inferred, if the end is 100 %). Overshoot direction: the first swing passes rest in the direction of travel (down), inferred from the expression. Both properties then sit still. The finished wobble is never played in this video stretch; no frame of 302–378 s shows it moving (only the editing fast-forward overlay), so the wobble figures are computed, not seen. What is seen: the keys-only drop, before the expression is added, plus the pose at the first key.
timing and easing: Keys 4 frames apart at 30 fps, first at comp start (said four frames; shown f008757). Easing of the keys: shown as plain diamonds (default key type), no ease set on screen. Bounce timing comes from the expression values above (frequency 1.8 Hz, decay 3, window 3 s).
variations: none given
pitfalls: none given
longest on: Timed from frame numbers at 30 fps: the Scale keys and expression, f009528–f010440 (about 30 s), is the longest stretch; the repeat on the remaining nulls, f010467–f011352 (about 29.5 s), is next; the Position start key and four-frame key (f008021–f008822, about 26 s) and the Alt-click/paste of the Position expression (f008822–f009514, about 23 s, which also contains the played drop) are close behind. No part is stressed far more than another.
build notes: Per null: transform.position.setValueAtTime(0, [x, y-150]) and setValueAtTime(4/30, [x, y]); scale 60 → 100 (card). Then `prop.expression = "<pasted expression>"` on both Position and Scale. Expression is the block quoted under step 5, pasted unchanged: amp .04, freq 1.8, decay 3, time_max 3, uses nearestKey, velocityAtTime(key.time - frameDuration/10), easeOut(t,0,time_max,1,0). Keys are best set via script; expression text via script too. No interface-only step.
result: start=294.0 end=295.3 animated crop=555,131,960,540 frame=f008852
before: f010510 (start pose of the card after the Scale keys, 60 % size, with the dashed layer outline and anchor handles still on it; not part of the played drop, not the finished picture). The window is the keys-only position drop, played in the viewer, cut from source.mp4: card at the high start pose, full width, at 294.30 s; mid-drop at 294.33 s; nearly down at 294.37 s; at rest from 294.40 s and through 295.3 s. So the drop itself is about 0.1 s of video (294.30–294.40 s). The high start pose returns from 295.4 to 295.9 s (anchor handles and small red boxes on it) and the next drop is under way at 296.0 s, at rest by 296.2 s (the preview loops). The comp time display stays frozen at 0:00:00:00 (read at f008822, f008852, f008882) during the preview, so the proof that it plays is the viewer's own redraws; no redraw count against the work area was taken, so speed in comp frames rests on the 4-frame key spacing alone. f008852 is the clean at-rest frame inside the crop: no mouse arrow, handles, dialog or panel edge. The expression is not yet on in this window, so the drop is plain and has no wobble; after the paste (302 s) to 378 s no bounce plays. Unlike the recipe's first version, f010510 is only the start-pose reference.
unknowns: End scale value of the card null (100 % inferred); the text null's position start value; key ease type (plain diamonds, no ease shown); whether the bounce settles as computed (never played in this stretch; recipes 04 and 05 show it moving); whether the outer null gets the expression; why the logo shifts right at 84 % scale. The viewer's fast-forward icon (f011165/f011352) is an editing overlay, not part of the comp.

## Offset the logo and text groups a few frames behind the card
id: 04-staggered-element-offsets
status: unproven
variant of: 05-staggered-slide-in (Tf0EiCGOEYs #05)
differs: Shared: the stagger is made by sliding whole layer bars later in the timeline so each layer's keys travel with it, the first element staying at frame 0 (the parent's step 6: "sliding whole layer bars along the timeline (keys travel with them)", headline at frame 0; its build notes shift each layer's `startTime`). Differences: here the parts are groups, each a null plus its child layers (logo with its null, three text layers with theirs), and the card's own layers stay at 0; in the parent step 1 lists three layers (headline, button precomp, web address) and no nulls. Here the offsets are about 2 f (logo) and about 4 f (text) at 30 fps; in the parent they are 5 f (button) and 10 f (address) at 60 fps (its step 6). Here every group does a drop and settle with a bounce expression (recipe 03) and the order is card, logo, text; in the parent each layer does a left-to-right slide of two Position keys 47 frames apart with 65 % influence easing (its steps 2 to 4), with no expression listed among its ingredients. Here the offsets were read off the timeline ruler (the narrator said two to three frames); the parent's 5 and 10 are measured on the zoomed ruler (its step 6).
merge: confirmed (carried from checks/04-before-proof.md; the variant of and differs lines are unchanged)
source: tYjqtArZtds 378.9–425 s
jobs: energy and impact; layout and repetition
what it does for a beat: Reach for it when several parts of one card all get the same drop-and-settle move and read as a single stiff block. Sliding the start of each part a couple of frames later makes the parts land one after another.
what it looks like: A pill-shaped grey card with a round logo at its left, a title and a subtitle line, and a small grey "NOW" label at the top right. Played, the card drops from high and small, overshoots to about 109 % of its settled width and settles; the logo follows from the card's upper-left corner a moment later, and the text arrives last, from well above the card, so the group builds in sequence.
ingredients:
- Parent nulls already carrying keys and the bounce expression (see recipes 02-null-hierarchy-for-grouped-motion and 03-expression-bounce-drop-in) — built-in
- Layer start-time shift in the timeline — built-in
steps:
1. Select the logo layer together with its own null, then drag them later in the timeline by two to three frames, so their keys start after the card's. (said; the bars after the move start about 2 f in on the ruler, shown f012250: bar edge x=740 against 0 f at x=709 and 5 f at x=786, 15.8 px a frame)
   - Logo and logo null start: about 2 f after the card (shown f012250, measured from the ruler)
2. Select the three text layers (title, subtitle, "NOW" label) with their text null and shift them the same way, a little further than the logo. (said "do the same for all the text layers")
   - Text layers and text null start: about 4 f after the card (shown f012250: bar edge x=771 is 3.9 f). The narrator said two to three frames; the screen shows about 2 and about 4 for the two groups, so the screen decides.
3. Leave at frame 0 the master null at the top of the stack (all the group nulls are parented to it), the card's own null, and the card's layers: the stroke, the pill layer that carries the effect and the adjustment switch, and the depth layer. (shown f012250 and the timeline at f012380: their bars start at the ruler's 0)
4. Make sure every null in the groups (and the card's null) carries the author's bounce expression on both Position and Scale, so the drop settles with a wobble; it reads each layer's own keys, so it moves with the layer when the bar is slid. Pasted earlier in the video (narration 259–353 s, recipe 03), not in this stretch. (said (description) for the text; said for where it goes, 259.0 s and 353.5 s per extras.md)
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
5. Scrub the first frames and check the order: card, then logo, then text. (shown f012291, viewer and timeline both at 3 f: card and logo in, text not yet; inferred that this is the intended read)
6. Preview the first second or so; the arrival is played as a looping preview (shown f012350, f012380, f012410: the viewer's own time readout runs while the timeline's readout holds at 0). (shown)
layout: All figures measured on the 960×540 picture crop (crop origin 555,131 in the 1920×1080 frame; the picture is 1920×1080 comp px, so double them for comp px). Settled card (f012350, comp 13 f): width 667 px = 69.5 % of the picture width, height about 157 px = 29 % of the picture height (about 0.235 of its width), centred horizontally, centre at about 49 % of the height (266 px from the top). Logo disc: 94 px across = 0.60 of the card's height (0.14 of its width), centre 81 px (0.12 of the card width) in from the card's left edge and level with the card's centre. Title and subtitle left-aligned to the right of the disc, title about 26 px above the card's centre; "NOW" label small, grey, at the card's top right. Card light grey with a thin lighter stroke and a soft inner shade; ground near white. Not a different file: the finished example is the build the author made.
  Played arrival (source 412.5–413.2 s, redraws read from the video): the viewer redraws about once per comp frame on average (comp 1 f at 412.67 s, readout 13 f by about 413.1 s), a loop restart at 0 f, then a hold of about 0.6 s on the start pose before the drop plays. Comp frames are skipped now and then (the scrub at 3 f shows a card at 81 % width, which no played redraw shows), so the frame labels below are good to about ±1.
  - Start pose (0 f, no logo, no text): card 405 px wide = 61 % of its settled width, centre at 145 px from the top = 27 % of the picture height, 121 px (about 240 comp px) above the settled centre. Selection boxes of the nulls show here only (a small one at the card's centre, a larger one about 100 px below it).
  - Card width then: 71 % (1 f), 91 % (about 2–3 f), 101 %, 108–109 % (peak, about 4–6 f; centre 28 px below its settled height), 104 % (about 8 f), 98 % (about 11–12 f), 100 % (about 13–14 f). Centre height follows: 27 % of the picture height at 0 f to 31 % at the peak, 48 % at the dip, 49 % settled.
  - Logo: first seen about 1 redraw after the card starts to drop, at the card's upper-left corner. Measured on the 3 f scrub f012291 (picture crop 960×540; card there is 540 px wide = 81 % of settled, top edge y 144, bottom 270, centre y 207): disc centre y 150, x 267 (57 px in from the card's left edge at x 210), 78 px across (about 80 % of its final 94 px). So against the card's CURRENT centre it sits 57 px higher and about 6 px below the card's top edge; against its SETTLED spot (centre y 266) it is about 116 px higher. This is one scrub frame, not a played redraw. It reaches the card's level about 4 redraws later and then rides with the card.
  - Text: first seen about 2 redraws after the logo, title about 136 px above the card's centre (about 110 px above its settled place), sliding down into place over about 6 redraws, level with its settled place at about 8 f; it fades or appears whole (opacity not read).
  - The logo's path is its own, not the card's: it starts at the card's top left, not on the card's centre line.
timing and easing: offsets of about 2 f (logo) and 4 f (text) after the card, at 30 fps. Eases of the underlying keys: none given. The overshoot of the card (about 109 % of settled width) comes from the bounce expression of recipe 03, not from this step.
variations: none given
pitfalls: none given
longest on: Moving the logo and its null, then the text group, in the timeline and scrubbing to check; the section runs about 46 s in all (f011367–f012750). Per part not timed beyond that.
build notes: Per group, set the layer's startTime on the null and on its child layers to the card's start plus 2/30 s (logo) and 4/30 s (text). Moving the layer moves its keys, so the bounce expression (which uses its own keys) shifts with it. Do it on every layer of the group, not on the null alone, or the children's own fades will still start at 0. The start poses (card at 61 % scale, 240 comp px high; logo and text higher still) come from the earlier recipes' keys; check against the measurements above. By hand: dragging in the timeline.
result: start=412.67 end=413.17 animated crop=555,131,960,540 frame=f012350
before: f012291
unknowns: Exact comp frame of each redraw (played preview skips frames, labels ±1); the logo's and text's own start values and whether the text has an opacity key; any easing on the keys; the exact frame count of the work area (about 38 f read off the ruler). The played window holds the crop from 412.5 s to 413.2 s (card, logo and text all inside it, no mouse arrow, no dialog); nulls' selection boxes show only in the first two redraws (412.50–412.57 s), so start the compared window at 412.67 s. f012350 is the clean settled still (comp 13 f); no kept frame is a clean mid-move frame, cut one from source.mp4 at 412.80 s.

## Second notification arrives and the first one is pushed back
id: 05-stacked-second-notification-with-push-back
status: unproven
source: tYjqtArZtds 429–535 s
jobs: energy and impact; layout and repetition; depth and finish
what it does for a beat: Use it when a second card lands on top of a card already on screen and the first should react: sink, shrink and settle with a small springy wobble instead of just being covered.
what it looks like: A wide frosted pill card sits centred on a near-white ground. A copy drops in from above and lands on top at the same spot with a soft bounce, while the original slides down behind it, a little smaller, its lower part peeking out under the new card. The new card's glass blurs what lies behind it.

ingredients:
- Finished notification build (a group of shape, text and logo layers, all parented to a chain of null layers ending in one top "main" null) — built earlier in the video, not part of this technique
- Duplicate layers (select all, duplicate, move copies to top of the stack, slide them later in time) — built-in; shortcut Ctrl+D said; menu path inferred (Edit > Duplicate)
- Position and Scale keyframes on the first notification's main null — built-in
- Bounce expression on both Position and Scale — stock; text supplied in the video description; used unchanged (said (description))

steps:
1. Select every layer of the finished notification and duplicate them (said, including the Ctrl+D shortcut; the Edit > Duplicate menu path is inferred, no menu is on screen).
2. Move the duplicated set to the very top of the layer stack (said). Layer list at f013354 shows the copies ("… 2" names) above the originals (shown f013354).
3. Slide the duplicated layers later in time by 15 to 20 frames (said). Their bars start at about frame 15 on the ruler (shown f014761, bars start under the playhead at 0:00:00:15; measured from the ruler, ≈ frame 15).
   - Result: the copy repeats the original's entrance, including its bounce, from that moment (inferred from the finished clip; frames 15919–15922 were cut from source.mp4, not kept frames). The copy's entrance is the one built in 03-expression-bounce-drop-in and 04-staggered-element-offsets: start 150 px above rest and at 60 % scale, 4 frames to rest, bounce expression amp 0.04, freq 1.8, decay 3; logo parts start 2 frames and text parts 4 frames after the card, so the copy's parts arrive one after another (at 15919 the logo is in while the card's text is still missing).
4. Select the first notification's main null (the null at the top of its parent chain, with no parent itself — shown f014954, parent column "None") and add Position and Scale keyframes (said). First keys are set where the playhead stands, at time 15, with Position 960,540 and Scale 100,100 (shown f014761).
5. Paste the bounce expression onto both Position and Scale of that null (said). The values go red, which marks an expression (shown f015263). Expression used is the one from the description, with amp 0.04, freq 1.8, decay 3, time_max 3 (said (description)). Full text, word for word (said (description)):
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
6. Move the first key (and its Scale partner) from frame 15 back to about frame 13, two frames before the copy starts (said); the diamonds then sit at about 13 (inferred from diamond x position against the ruler, f014954). The 15 in step 4 is only where the keys were first made.
7. Go about five frames on and lower both values slightly (said). The second key's time reads frame 19 on the time display (shown f015263), so the span is about 6 frames from key one by measure; the narrator's "five" is rounded.
   - Position (second key): Y first read 617, then 636, 652 along the way (617 and 636 read from the timeline panel text; 652 shown f015341) and finished at 960, 676 (shown f015516, f015568 — panel reads 960.0,676.0).
   - Scale (second key): 86 % passed through (shown f015263), 90 % at the end (shown f015516 — 90.0,90.0 %).
8. Preview. The original now sinks 136 px and shrinks to 90 % over about 6 frames as the copy arrives, then wobbles, while the copy carries its own bounce (seen in the finished clip, frames 15918–15930 cut from source.mp4).

layout: (all measured on the finished clip frames f015967 and a 9-frame sheet 15890–15970; the clip fills the whole 1920×1080 picture and the card sizes match the editor view at 100 % scale, so one is the other)
- Front (new) card: about 70 % of picture width (≈1350 px), about 29 % of picture height (≈315 px), a fully rounded pill; centred at x 50 %, y 50 % of the picture. measured
- Back (first) card: about 90 % of the front card in each direction (≈1215 × 283 px), centred about 12.5 % of picture height (≈135 px) below the front card's centre, i.e. at y ≈ 62.4 %. This matches the typed key (540 → 676, scale 90 %). measured
- Overlap: front card hides the back card's upper part; about 10.8 % of picture height (≈117 px) of the back card shows below the front card. The back card's logo and text peek out under the front edge: its second line of text is sharp there, its logo only partly visible. measured
- The front card's glass blurs whatever sits behind it: the back card's logo shows through as a soft teal blob inside the front card's lower-left, and its text as dark smudges. measured. The blur is the card build of 01-frosted-glass-pill-from-adjustment-shape, which the copy's cards carry: the front card is an adjustment-layer pill with Fast Box Blur, Blur Radius 30, 3 iterations (said and shown in recipe 01), set for a card 1350 × 315 px (radius ≈ 2.2 % of the card width, 9.5 % of its height), with a 4 px CCCCCC outline and a 5 % black 'depth' pill under it, which gives the faint shading rim. Recipe 01's figures apply here; this clip's ground reads 247.
- Both cards have a thin pale outline and very light shading; ground is near white, slightly grey (about 247 in the clip; the editor's own white picture is brighter). The shadow under each card is faint. measured by eye only.
- Which objects carry it: only the first notification's top null is keyed; every layer of the first card follows it through parenting, so card, text and logo move and scale together (shown f013354, parent column). The copy's layers carry the original's bounce unchanged.
- Motion blur: the arriving copy and the sinking original are both streaked vertically in the clip (frames 15919–15922 cut from source.mp4). At 15921 the arriving card's small text is stretched to about 2 line heights (≈ 25–30 px of smear on glyphs ≈ 35 px tall, at 1920 wide) and card edges are doubled; the smear is vertical only. measured. Cause: not said or shown (no motion-blur switch is on screen in this technique). A smear along the direction of travel that fades as the cards settle is what the comp Motion Blur gives, not the glass box blur, so layer Motion Blur switches (plus the comp switch) are the likely cause: inferred. Card travel between clip frames 15920 and 15921 is ≈ 55 px; with smear ≈ 25–30 px the implied shutter is about 180–200° (smear ≈ speed × angle ÷ 360), matching the default 180°; inferred, as clip frame spacing against comp frames is unknown. Gone by 15930.
- Direction: the copy enters from above (a faint card sits above centre at its start, shown f014761, at y ≈ 275 of the editor's picture, i.e. ≈ 27 % of height from the top) and ends at the centre; the first card moves straight down, no sideways drift. At f015920 the new card is a blurred smear above the older one, so it arrives with a blur. (the copy's own entrance is built earlier in the video; only its look at arrival is given here).
- Motion size: first card moves 136 px down and loses 10 % scale. Bounce size from the expression: peak speed on Position over the 6 frames is ≈ 23 px per frame (680 px/s), so the first overshoot is ≈ 0.04 × 680 ≈ 27 px, decaying with e^(−3t) at 1.8 cycles per second; on Scale the initial wobble is ≈ 0.04 × 50 %/s ≈ 2 percentage points. (inferred from the pasted expression and the keys; not measured on the clip.)
- Overshoot read in the clip: the front card measured 68 % wide at f015933 (settling) and 70.4 % at f015967 (rest). measured. Source frames also read ≈ 75 % at 15924 and ≈ 71 % at 15930, so the front card overshoots to about 75 % before shrinking back to 70.4 %; it does not only settle from below.
- Result is the pre-made finished clip at the end, not the build just watched: it zooms to full screen and the build's panels are gone; the keys in the build (676, 90 %) match the clip's measured offset and size, so they appear the same.

timing and easing: Copy starts at about frame 15 (shown f014761). First key about frame 13 (inferred), second key frame 19 (shown f015263). Keys look like plain diamonds (linear) in the panel (shown f015263), no easing change is mentioned or shown; the springy feel comes from the expression: amp 0.04, freq 1.8, decay 3, time_max 3 (said (description)). In the clip the copy's blur-in and the sink play over roughly the same half second at preview speed (not timed; preview speed unknown).
variations: The narrator says the timing and values can be refined further (said).
pitfalls: none given, apart from the need to start the first card's keys a couple of frames before the copy starts so the reaction is not late (said).
longest on: Placing the two keyframes and typing the Position and Scale values on the first card's main null, with the bounce pasted on first: from about 7:40 to 8:41 (≈ 60 s of a 106 s technique); duplicating and shifting the copy took about 31 s (from the technique's 429 s start to 7:40.4).
build notes: In a script: duplicate all layers, set the duplicates' startTime +15 frames (0.5 s at 30 fps), put them above the originals. On the main null: setValueAtTime(13/30, [960,540]) and (19/30, [960,676]) for Position; Scale [100,100] and [90,90] at the same times; then set both properties' expression to the full text quoted in step 5, verbatim (including the easeOut factor). Turn on the comp's Motion Blur switch and the layers' switches (inferred, shutter about 180–200°). Keep the expression's `velocityAtTime(key(n).time - thisComp.frameDuration/10)` — it reads the move into the key. Keys are plain linear (inferred from diamond shape). Scale keys on a null need the link-dimensions switch on (the chain icon shows linked in f015516). If the cards are built differently from the original, 676 px is 12.5 % of a 1080 high comp: scale it to the card height (136 ≈ 0.43 × card height 315).
result: start=530.3 end=531.2 animated crop=0,0,1920,1080 frame=f015967
  - Played window source seconds 530.3–531.2 (frames 15910–15935): full-screen picture, no overlay, the new card arrives and the first one sinks. Still reference: 531.3–532.5 (frames 15940–15975) holds the same layout; use f015967 (clean, no arrow or handles). The kept frame f015984 is blank, so the clip fades or cuts at ≈ 532.7. The comp's time display is not visible in the clip, so frames per redraw are not counted.
before: f014761 (first card alone at centre, copy waiting above it, editor view)
unknowns: Exact first key time (13 is read from a diamond's position). Whether the narrator's "five frames" or the display's 19 is intended. Key interpolation type (looks linear). Whether Motion Blur switches are on (inferred only) and the exact shutter. Shadow darkness. Preview speed of the clip. The copy's entrance start position beyond a rough 27 % of height.

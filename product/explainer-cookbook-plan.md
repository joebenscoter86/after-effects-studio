# Explainer cookbook plan

Written 2026-11-21. One tutorial per session, in the order below. When a piece is done, tick it in the tracker and note what happened.

## Why this plan exists

Comp Room 0.4.2's cookbook has 57 proven recipes from six tutorials, and they're strong on looks: depth, finish, backdrops, headline reveals. **11 of the 27 jobs a beat can ask for return nothing at all.** These are the explainer jobs:

| Job id | What the beat needs |
|---|---|
| `land-number` | one figure arrives, hits and stays readable |
| `count-things` | how many, shown as objects you can count |
| `step-through-process` | steps that light up in order as they're named |
| `compare` | this against that, readable at a glance |
| `before-after` | the same thing before and after one visible change |
| `fail-then-fix` | something goes wrong, then the fix |
| `make-concrete` | an abstract line acted out by an object or small scene |
| `introduce-tool` | a named product on screen with its real mark |
| `show-proof` | a real result (chart, score, receipt) as evidence |
| `flag-a-problem` | a warning or wrong answer that reads as wrong |
| `call-to-action` | the ask and its keyword, unmissable at the end |

When a brief agent asks `ae_arsenal find` for one of these, it gets an empty list and builds from the motion-language docs alone. Each piece below learns one tutorial that teaches some of these.

## How the order was chosen

1. **How often explainers need the job.** Numbers, steps, comparisons, proof and the closing ask turn up in almost every explainer. Flagging a problem and before/after are common. Fail-then-fix is rarer.
2. **How many empty jobs one tutorial fills.**
3. **Whether the learner can use it.** Every step must be possible by script: no puppet pins, brush strokes or trackers placed by hand, and no paid plugins. Free plugins are fine (standing yes).
4. **Cost.** A 5-minute video is one easy session; a 50-minute one is a long session with many recipes.
5. **The finished result must already be the job (added 2026-11-26).** A recipe is tagged for what the tutorial's own result shows, not for what it could be used for. Pieces 4 and 11 were picked because their results could carry introduce-tool and flag-a-problem. Instead their recipes were tagged call-to-action, relate-things, add-impact and list-items. Pick a video whose result, as the author shows it, already is the job: a logo arriving for introduce-tool, a cross or a warning for flag-a-problem, a timer for show-time.

The picks were chosen from titles, chapter lists and descriptions. Nobody has watched them yet, so step 1 of every piece is a quick check that the video really teaches what its chapters say.

## Tracker

| # | Tutorial | Fills | Length | Risk | Status |
|---|---|---|---|---|---|
| 1 | SonduckFilm, [5 Infographic Edits You Should Know](https://www.youtube.com/watch?v=SKU3QdqKLOs) | land-number, compare, show-proof (not count-things) | 5 min | low | done: 5 written, 5 proven (accepted by Joe 2026-11-21), 0 held |
| 2 | Mavi Design, [Animate a Simple Call-To-Action Button Scene](https://www.youtube.com/watch?v=Tf0EiCGOEYs) | call-to-action | 15 min | low | done: 8 written, 8 proven (accepted by Joe 2026-11-21), 0 held |
| 3 | Mapal, [How To Animate Infographics Like VOX](https://www.youtube.com/watch?v=nHh0NRo8G2U) | step-through-process, show-proof, compare | 41 min | medium | done: 15 written, 15 proven (accepted by Joe 2026-11-21), 1 held |
| 4 | TomsProject, [SaaS Motion Graphics Masterclass](https://www.youtube.com/watch?v=tYRvoI04pJk) | make-concrete (not introduce-tool or flag-a-problem) | 52 min | medium | done: 13 written, 13 proven (accepted by Joe 2026-11-26), 0 held |
| 5 | Move Shapes, [Simple Before & After Transition](https://www.youtube.com/watch?v=SSAsTdXmKl0) | before-after | 3 min | low | not started |
| 6 | Flat Pack FX, [Stylized Timeline Animation](https://www.youtube.com/watch?v=9AtjrBHF560) | step-through-process | 14 min | low | not started |
| 7 | SonduckFilm, [5 Trendy SaaS Motion Graphics](https://www.youtube.com/watch?v=qe8_xGizSF0) | introduce-tool, flag-a-problem (the captions suggest neither) | 7 min | low | skipped 2026-11-26: the captions show five finishing looks, none for an empty job (rule 5) |
| 8 | SonduckFilm, [Create Explainer Video Animations](https://www.youtube.com/watch?v=lAUAVwYWFdI) | make-concrete | 13 min | medium | not started |
| 9 | SonduckFilm, [Create Callout Titles](https://www.youtube.com/watch?v=VZuHQVaC7oA) | flag-a-problem | 8 min | high | skipped 2026-11-26: the callout labels what's in the shot and its price, which reads as point-at-detail (five recipes already), not as a warning (rule 5) |
| 10 | fail-then-fix, built from pieces 5, 11 and 13 | fail-then-fix | none | none | not started |
| 11 | Zuyns, [How to Animate Notifications Like Apple](https://www.youtube.com/watch?v=tYjqtArZtds) | introduce-tool as support only (not flag-a-problem or fail-then-fix) | 9 min | low | done: 5 written, 5 proven (accepted by Joe 2026-11-26), 0 held |
| 12 | Motion Nations, [This LOGO Animation Method is so POWERFUL](https://www.youtube.com/watch?v=Nh3TenxxQzQ) (glow outline logo reveal) | introduce-tool | 12 min | low | next (picked 2026-11-26) |
| 13 | After Effects Channel, [Cross animation in after effects with trim paths](https://www.youtube.com/watch?v=UehuuNiZVuk) | flag-a-problem | 3½ min | low | not started |
| 14 | Smertimba Graphics, [Countdown Timer Tutorial](https://www.youtube.com/watch?v=99FUeOo4fiQ) | show-time | 2 min | low | not started |

**After piece 11, no job gained a main recipe: introduce-tool has a proven recipe only as a support job (03, the bounce drop-in, whose main job is add-impact), and flag-a-problem and fail-then-fix gained nothing (05's proof plays a warning card and its fix, but 05 is tagged list-items).** **After piece 4, no empty job was filled: introduce-tool and flag-a-problem are still empty (make-concrete gained a second recipe).** **After piece 3, 7 of the 11 empty jobs were still empty (step-through-process is filled; show-proof and compare gained recipes).** **After piece 2, 8 of the 11 empty jobs were still empty (call-to-action is filled).** **After piece 1, 9 of the 11 empty jobs were still empty.** **The plan expected only before-after and fail-then-fix to be empty after pieces 1–4; that did not hold, so pieces 7 and 9 are still needed for introduce-tool and flag-a-problem.** If you only have time for a few, do those four.

**Piece 11 (picked 2026-11-26, done the same day).** After piece 4, six jobs have no proven technique: count-things, show-time, before-after, fail-then-fix, introduce-tool and flag-a-problem (before-after and fail-then-fix have only paper pieces). Piece 7's captions show five finishing looks, none for these jobs. Piece 11 puts an app's logo and name on a notification card, which is introduce-tool as the job list defines it. The same card can carry a warning, and its second notification pushing the first aside is the shape fail-then-fix needs. It is 9 minutes, narrated and needs no plugins. It filled less than that: introduce-tool only as a support job, through 03 (whose main job is add-impact), and neither flag-a-problem nor fail-then-fix. No job gained a main recipe, and the next pick is open.

**Next (picked 2026-11-26, after piece 11): piece 12.** The same six jobs still have no main recipe. Piece 12 is a logo reveal: the author's result is a mark arriving, drawn by glowing coloured edges, which is introduce-tool on its face (rule 5). Introduce-tool comes up in nearly every tool explainer. The build works from any layer with transparency, so it suits a generated mark or a tool's name set in type. It is 12 minutes, narrated, with no plugins and 351,000 views.

**Run order (Joe, 2026-11-26: "let the full plan rip").** One session at a time. Each starts from the current `public/main`, runs its piece through proofs and Joe's acceptance, then opens its PR and merges it. Only then does the next session start: the pieces share the drafts, the generated cookbook and one After Effects. Pieces that fill an empty job go first.

1. Piece 12, the logo reveal (introduce-tool).
2. Pieces 5, 13 and 14 in one session, one after another: before-after, flag-a-problem, show-time. Each is under 4 minutes.
3. Piece 10, the fail-then-fix worked scene. It chains a problem marked as wrong (13's cross, or 11's red warning card), the change (piece 5), and the fixed state.
4. Piece 8 (make-concrete, which has 2 recipes).
5. Piece 6 (step-through-process, which has 4; for variety).
6. count-things: search for a tutorial whose result is objects you can count (an icon array, a unit chart). Add it as a piece and learn it if one is found.

Skipped on their captions (rule 5): pieces 7 and 9. A run stops and asks Joe before going past its video's $40 budget.

**Off the plan (2026-11-25):** Bart_VFX, [5 Editing Ideas You Should Try](https://www.youtube.com/watch?v=201iywIy74c), learned at Joe's request: 5 written, 5 proven (accepted by Joe 2026-11-25), 0 held. The new recipes serve reveal-headline, fill-the-backdrop and add-depth, so no empty job is filled. The run record is `quality/reports/2026-11-25-channel-learner-201iywIy74c/report.md`.

## The pieces

### 1. SonduckFilm, 5 Infographic Edits

- **Why first:** one short video fills four of the most-used explainer jobs. It's the same channel as all six tutorials learned so far, so the learner already handles its style well.
- **Chapters:** counter, shape infographic, bar chart, icon infographic, map infographic.
- **Watch for:** the map chapter uses Illustrator artwork. The art step can generate a map instead. If the map depends on Illustrator in a way a script can't follow, hold that recipe and keep the other four.
- **Done so far (2026-11-21):** five recipes, all new entries (no catalog parent): 01 counter on a slider (land-number), 02 ring fills to the value (land-number; show-proof, keep-it-alive), 03 bars grow to values (compare; show-proof), 04 icon fills to a value (land-number; make-concrete), 05 map regions fade up (point-at-detail; establish-place, list-items). 01–04 share the group "value slider rig". Checks passed in round 2 (01, 03) and round 3 or 4 (02, 04, 05); the misses were sizes calibrated on a punched-in shot (04), Easy Ease at 100 % influence rather than the default (02) and a moved counter (02).
- **Not filled:** count-things. The icon fills like a gauge; it does not show objects to count, so it is tagged land-number. count-things stays empty.
- **Map:** the After Effects part is only an opacity fade; region separation is an Illustrator step, so the proof needs generated art delivered as separate region layers with the names on their own layer.
- **Proofs (2026-11-21):** all five built at 9:16 on generated art and accepted by Joe ("Accept all five").
- **Still open: count-things.** No proven recipe fills it, and no piece below targets it. Needs a tutorial that builds an icon array, pictogram grid or unit chart ("1 in 10 people"). Check piece 3's technique list first, then search for one and add it as a new piece.
- **Parked:** the 05 map proof's art. Neighbouring lit provinces in near coral tones merge at phone size (the tutorial keeps unlit countries between lit ones). The recipe is proven; only the proof still and its art would change. Joe chose to leave it for now.

### 2. Mavi Design, call-to-action button scene

- **Why second:** almost every reel ends with an ask, and the cookbook has nothing for it. It's a single short technique, so it's a cheap win.
- **Chapters:** button made from a rounded rectangle, text, drop shadow, white background, button click.
- **Watch for:** it's a single scene, so expect one to three recipes. Make sure the ask's keyword stays readable at phone size when proving it at 9:16.
- **Done so far (2026-11-21):** the video has no narration, only music, which broke the timeline (lesson 27; the learner now builds a screen-only timeline from the chapters). Eight recipes:
  - 01 pill button in its own comp (call-to-action)
  - 02 soft lift shadow (add-depth; a variant of 7pgDb6NKEXM #05)
  - 03 end-card stack (call-to-action)
  - 04 tap cursor with rings (point-at-detail)
  - 05 staggered slide-in (call-to-action)
  - 06 cursor travels and taps the button (call-to-action)
  - 07 curved cursor route (call-to-action)
  - 08 staggered slide-out exit (hand-over)

  Groups: "tap cursor" holds 04, 06 and 07; "time stagger" holds 05 and 08. All eight passed in round 2 (05 and 08 again in round 3, 07 in round 4, after the proofs). The checks caught:
  - recipes that leaned on 02 and 03 for the card's figures
  - a curve handle put on the wrong key, which would bend the wrong leg
  - cursor tones compared against white when the cursor sits on the button's blue shadow
- **Proofs (2026-11-21):** all eight built at 9:16 on generated art (a "Driftday" end card, Montserrat ExtraBold and SemiBold installed for it) and accepted by Joe ("i approve"). 01–04 and 06 matched on the first build. 05, 07 and 08 came back "partly": the recipes left motion blur as a bare switch (lesson 28; rebuilt at a 680° shutter), and 07's entry route was read from a handle mid-drag and bowed nearly three times too deep (lesson 29; re-tracked by outline, now within 2 px). The build scripts are in `tools/channel-learner/proofs/Tf0EiCGOEYs`.
- **Left as is:** 07's cursor runs up to 4 frames behind the reference mid-entry, and its smear is about 40 px against 60–70, because the keys spread the move over about 20 frames where the recording takes 16. The reviewer called it barely visible and Joe accepted it. Front-loading the entry (x 405 by frame 110, x 563 by 114) would close it.

### 3. Mapal, infographics like VOX

- **Why:** the strongest teacher of steps lighting up in order (its "phase animation" and animated arrow), plus a box chart, pie chart, pyramid and map.
- **Watch for:** it's long, so expect 8–12 recipes and possibly two sessions. Split the work at "Box Chart Animation" (14:18). It uses two free plugins, Motion Tools and DecomposeText, which we can install. Design is done in Illustrator and Photoshop. Those design steps are build aids at most; generated art replaces them.
- **Done so far (2026-11-21):** the video teaches what its chapters say. Sixteen techniques, fifteen recipes passed, one held. All are new entries (no catalog parent).
  - Phase comp: 01 segmented progress bar draws in order (step-through-process), 02 labels rise from behind the bar through an inverted matte, 03 step pictures pop with a bounce in a 10-frame stagger, 04 curved arrow draws between steps, 05 stop-motion jitter with a black-and-white finish (finish-the-look), 06 faint graph-paper backdrop.
  - Bar chart: 07 stroked bars grow in a stagger with value labels (compare; show-proof), 08 baseline draws out from its centre, 09 grid clipped to the chart area.
  - Pie: 10 pie slice from a fat stroked ring (show-proof; land-number, compare), 11 label rises word by word (land-number).
  - Pyramid: 12 tiers spread to reveal labels (make-concrete), 13 match cut carried by movement (hand-over).
  - Map: 14 pinned photos sway on a map, 15 map washes and a self-drawing border (point-at-detail).
  - Groups: "trim paths draw-on" (01, 04, 07, 08, 10, 15, new), "time stagger" (03, 11), "stop-motion jitter" and "graph-paper grid" (new).
  - The checks caught eases converted to zero speed when the curve (0.88, 0.14, 0.12, 0.86) keeps about 16 % of the average speed at each key; a speed-graph value read mid-drag (the checker's own round-1 suggestion, caught in round 2); result windows that did not hold; and recipes that leaned on another recipe's figures.
  - **Held:** 16 tilted 3D map tour with shallow focus. One figure was still wrong after round 3 (the Europe print's width at its key). The reason is in the study's `drafts-held.md`; one change and a changed-lines check would revive it.
- **Proofs (2026-11-21):** all fifteen built at 9:16 on generated art: "The life of a pair of jeans" (process bar, water bar chart, pie), a limestone pyramid and an engraved island chart. Reviews: 01–05 and 07–12 matched on the first build. 06 matched once its grey grid lines turned out to be the recording's 4:2:0 encoding (lesson 33). 13–15 came back "partly" on framing (lesson 34) and matched once reframed. Phone MP4s sent; Joe accepted all fifteen ("Accept all 15"). The build scripts are in `tools/channel-learner/proofs/nHh0NRo8G2U`.
- **Open:** 12's recipe gives an anticipation speed graph (a 150 px/s hump) that its own key values (15–19 px over 13 frames) cannot reach. That line should be marked unreliable.
- **Not filled:** count-things. Nothing here shows a quantity as objects to count.

### 4. TomsProject, SaaS masterclass

- **Why:** product-launch style. An upload button (introduce-tool, call-to-action), a "bottleneck" graphic (flag-a-problem, make-concrete) and a Notes app screen (show-real-screen, which only has 2 recipes today).
- **Watch for:** the expressions it uses are in the video's pinned comment, not on screen. Copy them into the study folder during gather, because the learner only reads the screen and the speech. Skip the glowing-orb chapter if it's the same technique as the Hyper-Cinematic orb, which is already in the cookbook.
- **Done (2026-11-26):** the video teaches what its chapters say. Thirteen recipes, all passed, none held. 02 and 13 are variants (of nHh0NRo8G2U #03 and YBeMmC43Q1U #18); the rest are new entries.
  - Upload button: 01 red gradient pill swings up in 3D (call-to-action), 02 bounce-expression pop-in of the icon and letters (add-impact; the expression is the author's pinned comment, copied word for word).
  - Bottleneck: 03 glowing gradient line draws on out of the button (relate-things).
  - Workflow: 04 CC Light Sweep edge light on dark buttons (light-the-hero), 05 duplicate and stagger the layout with glowing links (one-to-many), 06 reversed gradient overlay and lens finish (finish-the-look).
  - Notes app: 07 buttons slide together and morph into an app window (hand-over; show-real-screen as support), 08 window dots and a soft grid panel (fill-the-backdrop), 09 typewriter that types, deletes and retypes (make-concrete).
  - Orb: 10 liquid gradient orb from wiggled shapes, spin blur and CC Sphere (light-the-hero), 11 orb grows from a dot through linked nulls (hand-over), 12 hollow ring by inverted matte and Echo (fill-the-backdrop), 13 text fills in from a soft ghost (reveal-headline). The orb was kept: it is built differently from the Hyper-Cinematic orb, and the merge step found no parent.
  - 04, 06, 07, 12 and 13 were held after round 3 and revived by the lead for one more fix; all passed.
- **Proofs (2026-11-26):** all thirteen built at 9:16 on generated art. 13 matched on its first build; 01, 03, 04, 06, 07, 08, 09 and 11 on their second; 02 on its fourth; 05 and 12 on their fifth. 11 of the 13 first builds came back partly, six of them on sizes that held only in the 16:9 frame (lesson 44). 10 stayed partly after eleven builds: texture, spin, lumpiness and the blue outer rings match, but not the broad cyan glow or a rim that stays at the edge, whose cause the tutorial never shows. Phone MP4s sent; Joe accepted all thirteen, 10 included ("approved"). The build scripts are in `tools/channel-learner/proofs/tYRvoI04pJk`.
- **Final proof:** a 19-second Comp Room promo that chains all thirteen (button, stalled line, flow, app window, typed brief, orb, ring with the promise), built from the proven scripts and reviewed independently: `~/Assets/comp-room-tests/2026-11-26-saas-showcase/`.
- **Not filled:** introduce-tool and flag-a-problem. The upload button is a call-to-action, and the bottleneck chapter teaches only the glowing line; nothing reads as a named product or as a warning. Pieces 7 and 9 stay on the plan for them.
- **Open:** 10's rim cause. The run record is `quality/reports/2026-11-25-channel-learner-tYRvoI04pJk/report.md`.

### 5. Move Shapes, before & after transition

- **Why:** before-after is common and this video is 3 minutes long.
- **Watch for:** it may be a plain wipe. If it teaches nothing beyond a masked wipe, write it as a short recipe and move on.

### 6. Flat Pack FX, stylized timeline

- **Why:** a second, editorial (Vox and WSJ) take on step-through-process. Do it if piece 3's step recipes are thin or fail their proofs. If piece 3 gives two or more proven step recipes, this one can wait.
- **Watch for:** the video has no chapters, so the technique list has to come from the timeline alone.

### 7. SonduckFilm, 5 Trendy SaaS Motion Graphics

- **Why:** posted 2026-11-16, same channel, product-launch style. Its chapters are only named "Technique 1" to "Technique 5", so we don't know what it teaches yet.
- **Do first:** gather and align, then read `timeline.md` and list the five techniques. If none fills an empty job, stop there and mark it "skipped, no explainer jobs".
- **Now also for (2026-11-26): introduce-tool and flag-a-problem,** which piece 4 did not fill.
- **Captions read (2026-11-26).** The five techniques:
  1. a radial-blur shadow under a shape with a thin Bevel and Emboss (the same mechanism as 201iywIy74c 03);
  2. blueprint lines from a Repeater, drawn on with Trim Paths set to Individually and rolled in on a parent null;
  3. multicoloured letters traced by a matted stroke, with a small leading block;
  4. a glass plate from Bevel and Emboss at 0 % fill opacity with a white Outer Glow;
  5. a PNG made 3D under a point light, casting a soft shadow on a shadow-only floor.

  None puts a named product on screen or marks something as wrong, so this piece is unlikely to fill either job. Gather and align only to confirm, then mark it skipped if the timeline agrees.

### 8. SonduckFilm, explainer video animations

- **Why:** make-concrete, an idea acted out by a small scene.
- **Watch for:** it starts by downloading stock vector graphics. That part is a build aid we already have ("found vector art as separate layers"). The value is in the animating chapter. Generated art replaces the stock graphics.

### 9. SonduckFilm, callout titles

- **Why:** a callout that marks a spot, for flag-a-problem.
- **Check against rule 5 (2026-11-26):** this was picked from its title. A callout title is a line and a label pointing at a spot, which reads as point-at-detail unless the author styles it as a warning. Read the captions before running it.
- **Skipped (2026-11-26).** The captions show a neutral callout:
  - two text layers naming what's in the shot and its price;
  - a gradient-ramped ring with a 30 px stroke;
  - a thin angled pointer line ending in a white dot.

  Nothing marks it as wrong, so it would be tagged point-at-detail, which already has five recipes. Piece 13 takes flag-a-problem instead.
- **Risk:** step 3 attaches the callout with the 3D camera tracker, which is driven from the interface. Keep the callout design and animation recipes (steps 1–2) and hold the tracking. Its sibling, [Hand-Drawn Marker & Arrows](https://www.youtube.com/watch?v=ZGahTJcpwz8), was left out on purpose: it draws with the brush tool by hand, the same problem that got the puppet-pin recipes dropped.

### 10. fail-then-fix, from pieces we already have

- No tutorial teaches it as one thing. Once flag-a-problem (piece 13; piece 11 did not fill it, though its red warning card can play the problem) and before-after (piece 5) are proven, write one worked scene that chains them: the problem marked as wrong, then the change, then the fixed state. File it as a build aid that names those recipes, or as a worked scene in the library.

### 11. Zuyns, Apple-style notifications

- **Why (picked 2026-11-26):** an iOS-style notification card that carries an app's logo and name. That is introduce-tool ("the app's name with its real logo"). The same card reads as a warning when its text says something went wrong. A second notification that pushes the first down is the shape of fail-then-fix ("the first upload fails red, the retry goes through green"). Posted 2026-05, 9 minutes, narrated, no plugins.
- **What it teaches (from the captions):**
  - The card is a 1350 × 350 rectangle at roundness 110, with a depth copy at 5 % opacity and a stroke copy at 4 px.
  - The card itself becomes an adjustment layer with Fast Box Blur 30, which gives the frosted look.
  - Nulls hold the card, the text and the logo, all under one main null.
  - Each null drops in over four frames of position and scale keys, with a bounce expression.
  - The logo and text are staggered 2–3 frames behind the card.
  - A second notification arrives 15–20 frames later, and the first steps down and shrinks slightly as it lands.
- **Watch for:**
  - The bounce expression is in a Google Doc linked from the description, not on screen. Copy it word for word into `extras.md` during gather (lesson 36). It may be the same inertial bounce as nHh0NRo8G2U #03 and 201iywIy74c 01; the merge step decides.
  - The font is SF Pro, whose licence covers mock-ups for Apple's own platforms. Prove with a free stand-in such as Inter, and say so in the build notes.
  - The proof's art needs an app mark that looks real but is no real brand. Generate one.
  - Expect two to four recipes: the frosted card, the bounce-and-stagger entrance (probably a variant) and the stack that reacts. Tag the card for the beat it serves in the proof, and prove one card as a warning so flag-a-problem can be judged too.
- **Also found while picking (2026-11-26):**
  - show-time: Smertimba Graphics, [Countdown Timer Tutorial](https://www.youtube.com/watch?v=99FUeOo4fiQ), 2 min, a countdown from one expression. It is the cheapest fill left after piece 5.
  - flag-a-problem: AEffecto, [How To Edit Viral Documentaries Like VOX](https://www.youtube.com/watch?v=Ii3MVHwECys), 63 min. It has a red marker circle (from a supplied PNG, keyed) and red thread lines between photos. That is too long for one flag-a-problem recipe, unless show-proof or relate-things need more.
  - count-things: searches for icon arrays, pictogram grids and unit charts found only templates, no tutorial.
- **Done so far (2026-11-26):** the video teaches what its captions say. Five recipes, all passed, none held:
  - 01 frosted card (add-depth; a variant of 201iywIy74c #05);
  - 02 null grouping (build aid);
  - 03 bounce drop-in (add-impact, supports introduce-tool; a variant of nHh0NRo8G2U #03);
  - 04 logo and text stagger (reveal-headline; a variant of Tf0EiCGOEYs #05);
  - 05 second card with push-back (list-items).
  The expression is the description's Google Doc, the same text as tYRvoI04pJk's pinned "Bounce"; the recipes now quote it word for word (lesson 51). Lessons 50–52 came from this run.
- **Proofs (2026-11-26):** all five built at 9:16 on generated art for an invented app, Larkvault, with Inter Tight standing in for SF Pro. 05's first card is a red "Backup failed" warning that the "Backup complete" card lands over. Every review ends "matches": 04 and 05 on their first builds, 01 and 02 on their second, 03 on its third. Phone MP4s sent, and Joe accepted all five on 2026-11-26; their stills are in the arsenal, and `find introduce-tool` now returns 03. The run record is `quality/reports/2026-11-26-channel-learner-tYjqtArZtds/report.md`.
- **Filled:** introduce-tool as support only, through 03, whose main job is add-impact. No recipe takes introduce-tool as its main job.
- **Not filled:** flag-a-problem and fail-then-fix. 05's proof plays a red warning card and the fix landing over it, but 05 is tagged list-items, so neither job gained a recipe. Pieces 9 and 10 stay on the plan for them.

### 12. Motion Nations, glow outline logo reveal

- **Why (picked 2026-11-26):** the author's result is a logo arriving, drawn by glowing coloured edges. A named mark arriving is introduce-tool ("the app's name with its real logo"), with no reframing needed (rule 5). The effect is procedural: it works on any layer with transparency, a mark or a word, and the author saves it as a preset to reuse.
- **What it teaches (from the captions):**
  1. The logo sits in its own comp, nested in the main comp.
  2. Fill turns the logo black, so only its edges will show; on a background, the layer goes to Add.
  3. CC Light Sweep is set to edge only (Sweep Intensity 0, centred) to make the outline.
  4. The layer is duplicated twice, and each copy gets its own colour and its own angle.
  5. Direction is keyed to send the coloured edges around the mark.
  6. Glow is added, and then the logo itself is revealed and composited.
  7. Last come the procedural controls and saving the preset.
- **Watch for:**
  - The author's demo logo is a real brand's. The proof needs a generated mark that looks real but is no real brand, plus the tool's name in type, so the beat reads as a named tool.
  - Saving the preset (10:25) is a build aid at most. The preset itself is on Patreon; the video builds the effect from scratch, and the recipe is that build.
  - The CC Light Sweep edge outline is the mechanism of tYRvoI04pJk #04 (edge light on buttons, light-the-hero), so the merge step may make it a variant. Lesson 43 keeps a variant findable for introduce-tool, which its parent doesn't serve. Tag it for introduce-tool, not for the light.
  - A shorter take on the same effect, with every value said aloud, is Fx Studio, [Clean Logo Reveal Tutorial in After Effects](https://www.youtube.com/watch?v=lRyUAE5r6MA) (4 min):
    - CC Light Sweep width 80, edge intensity 90;
    - three Glows at radius 50, 200 and 500;
    - CC Composite fading the logo in.

    If piece 12's recipe comes out thin, use it as a second source. Don't learn it as a separate piece.
- **Other candidates found (2026-11-26), each one whose result is the job:**
  - flag-a-problem: After Effects Channel, [Cross animation in after effects with trim paths](https://www.youtube.com/watch?v=UehuuNiZVuk), 3½ min. An X drawn by two trimmed strokes; it reads as wrong once it's red over the thing it marks.
  - show-time: Smertimba Graphics, [Countdown Timer Tutorial](https://www.youtube.com/watch?v=99FUeOo4fiQ), 2 min (in piece 11's notes).
  - before-after: piece 5.
  - These three are each under 4 minutes. One session could learn them one after another and fill three empty jobs.
  - count-things: still no tutorial found.

### 13. After Effects Channel, cross with trim paths

- **Why (picked 2026-11-26):** an X drawn by two trimmed strokes. In red, over the thing it marks, it reads as wrong before anything is explained, which is flag-a-problem (rule 5). 3½ minutes, narrated, no plugins.
- **What it teaches (from the captions):**
  - a pen-drawn line with no fill and a round cap;
  - Trim Paths keyed with End 0 → 100, then Start 0 → 100 a little later, so the line travels;
  - the lines put together into the cross.
- **Watch for:** the recipe may be thin. Prove it as a red X landing over a wrong answer, so the proof shows the job. Run it in the same session as pieces 5 and 14.

### 14. Smertimba Graphics, countdown timer

- **Why (picked 2026-11-26):** a countdown made from one expression. A clock that runs and stops on its time is show-time ("ready in 15 minutes"). 2 minutes, narrated, no plugins.
- **Watch for:** the expression is shown on screen or in the description; copy it word for word into `extras.md` (lesson 36). Prove it as a timer that stops on the beat's number. Run it in the same session as pieces 5 and 13.

## How to run one piece in a fresh session

Paste this, with the number filled in:

> Do piece N of `product/explainer-cookbook-plan.md`. Follow the steps under "How to run one piece".

The steps:

1. **Start from current main.** Link the studies folder with `node tools/channel-learner/learn.mjs link <worktree root>`. Studies live in `~/Assets/comp-room-studies/channel-study/`, outside every worktree.
2. **Gather and align:** `node tools/channel-learner/learn.mjs gather <url> --out quality/renders/channel-study/<video id>`, then `learn.mjs align` on the same folder.
   - Exit code 3 means YouTube's bot check stopped it. Try again later, and don't retry in a loop.
   - Transcribe with local whisper; the learner does this itself.
   - If the narration sends viewers to a comment or the description for an expression or settings, copy it word for word into `<study folder>/extras.md` (`yt-dlp --write-comments` gives the pinned comment). Writers and checkers are told to read it (lesson 36).
3. **Check the video is what the plan says.** Read `timeline.md`. If it doesn't teach the jobs listed for the piece, update this plan and stop.
4. **Recipes:** follow `tools/channel-learner/prompts/video-lead.md` to write, check and match the recipes. It ends with `node tools/channel-learner/assemble.mjs <study folder>`.
5. **Proofs:**
   - Follow `tools/channel-learner/prompts/prove.md` and `prove-run.md`.
   - Build on Higgsfield-generated art made to a brief, never plain stand-ins, and prove at 9:16.
   - Send Joe the phone MP4s. A recipe becomes proven only when Joe accepts it.
6. **Rebuild the cookbook:** `node tools/channel-learner/arsenal.mjs`, then run the arsenal tests.
7. **Record it:**
   - Tick the piece in the tracker, with recipe counts (written, proven, held) and anything learned.
   - Add a LESSONS entry for any failure, in the same commit as the rule change it led to.
8. **Ship in batches.** Don't cut a release per piece. A release after pieces 1–4 is a natural point.

Steps 1–4 need no After Effects. If After Effects is busy, a session can stop after step 4 and leave the proofs for the next one.

## Not part of this plan

The three unproven recipes that are blocked (two metal titles waiting on the material library, the too-bright orb) and the other follow-ups are in `product/deferred-after-0.4.2.md`.

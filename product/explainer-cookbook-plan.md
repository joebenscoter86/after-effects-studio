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

The picks were chosen from titles, chapter lists and descriptions. Nobody has watched them yet, so step 1 of every piece is a quick check that the video really teaches what its chapters say.

## Tracker

| # | Tutorial | Fills | Length | Risk | Status |
|---|---|---|---|---|---|
| 1 | SonduckFilm, [5 Infographic Edits You Should Know](https://www.youtube.com/watch?v=SKU3QdqKLOs) | land-number, compare, show-proof (not count-things) | 5 min | low | done: 5 written, 5 proven (accepted by Joe 2026-11-21), 0 held |
| 2 | Mavi Design, [Animate a Simple Call-To-Action Button Scene](https://www.youtube.com/watch?v=Tf0EiCGOEYs) | call-to-action | 15 min | low | recipes: 8 written and checked, 0 proven, 0 held |
| 3 | Mapal, [How To Animate Infographics Like VOX](https://www.youtube.com/watch?v=nHh0NRo8G2U) | step-through-process, show-proof, compare | 41 min | medium | not started |
| 4 | TomsProject, [SaaS Motion Graphics Masterclass](https://www.youtube.com/watch?v=tYRvoI04pJk) | introduce-tool, flag-a-problem, make-concrete | 52 min | medium | not started |
| 5 | Move Shapes, [Simple Before & After Transition](https://www.youtube.com/watch?v=SSAsTdXmKl0) | before-after | 3 min | low | not started |
| 6 | Flat Pack FX, [Stylized Timeline Animation](https://www.youtube.com/watch?v=9AtjrBHF560) | step-through-process | 14 min | low | not started |
| 7 | SonduckFilm, [5 Trendy SaaS Motion Graphics](https://www.youtube.com/watch?v=qe8_xGizSF0) | probably introduce-tool | 7 min | unknown | not started |
| 8 | SonduckFilm, [Create Explainer Video Animations](https://www.youtube.com/watch?v=lAUAVwYWFdI) | make-concrete | 13 min | medium | not started |
| 9 | SonduckFilm, [Create Callout Titles](https://www.youtube.com/watch?v=VZuHQVaC7oA) | flag-a-problem | 8 min | high | not started |
| 10 | fail-then-fix, built from pieces 4, 5 and 9 | fail-then-fix | none | none | not started |

**After piece 1, 9 of the 11 empty jobs are still empty. After pieces 1–4, only before-after and fail-then-fix are.** If you only have time for a few, do those four.

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

  Groups: "tap cursor" holds 04, 06 and 07; "time stagger" holds 05 and 08. All eight passed in round 2. The checks caught:
  - recipes that leaned on 02 and 03 for the card's figures
  - a curve handle put on the wrong key, which would bend the wrong leg
  - cursor tones compared against white when the cursor sits on the button's blue shadow
- **Next:** proofs (step 5) at 9:16. The keyword has to stay readable at phone size.

### 3. Mapal, infographics like VOX

- **Why:** the strongest teacher of steps lighting up in order (its "phase animation" and animated arrow), plus a box chart, pie chart, pyramid and map.
- **Watch for:** it's long, so expect 8–12 recipes and possibly two sessions. Split the work at "Box Chart Animation" (14:18). It uses two free plugins, Motion Tools and DecomposeText, which we can install. Design is done in Illustrator and Photoshop. Those design steps are build aids at most; generated art replaces them.

### 4. TomsProject, SaaS masterclass

- **Why:** product-launch style. An upload button (introduce-tool, call-to-action), a "bottleneck" graphic (flag-a-problem, make-concrete) and a Notes app screen (show-real-screen, which only has 2 recipes today).
- **Watch for:** the expressions it uses are in the video's pinned comment, not on screen. Copy them into the study folder during gather, because the learner only reads the screen and the speech. Skip the glowing-orb chapter if it's the same technique as the Hyper-Cinematic orb, which is already in the cookbook.

### 5. Move Shapes, before & after transition

- **Why:** before-after is common and this video is 3 minutes long.
- **Watch for:** it may be a plain wipe. If it teaches nothing beyond a masked wipe, write it as a short recipe and move on.

### 6. Flat Pack FX, stylized timeline

- **Why:** a second, editorial (Vox and WSJ) take on step-through-process. Do it if piece 3's step recipes are thin or fail their proofs. If piece 3 gives two or more proven step recipes, this one can wait.
- **Watch for:** the video has no chapters, so the technique list has to come from the timeline alone.

### 7. SonduckFilm, 5 Trendy SaaS Motion Graphics

- **Why:** posted 2026-11-16, same channel, product-launch style. Its chapters are only named "Technique 1" to "Technique 5", so we don't know what it teaches yet.
- **Do first:** gather and align, then read `timeline.md` and list the five techniques. If none fills an empty job, stop there and mark it "skipped, no explainer jobs".

### 8. SonduckFilm, explainer video animations

- **Why:** make-concrete, an idea acted out by a small scene.
- **Watch for:** it starts by downloading stock vector graphics. That part is a build aid we already have ("found vector art as separate layers"). The value is in the animating chapter. Generated art replaces the stock graphics.

### 9. SonduckFilm, callout titles

- **Why:** a callout that marks a spot, for flag-a-problem.
- **Risk:** step 3 attaches the callout with the 3D camera tracker, which is driven from the interface. Keep the callout design and animation recipes (steps 1–2) and hold the tracking. Its sibling, [Hand-Drawn Marker & Arrows](https://www.youtube.com/watch?v=ZGahTJcpwz8), was left out on purpose: it draws with the brush tool by hand, the same problem that got the puppet-pin recipes dropped.

### 10. fail-then-fix, from pieces we already have

- No tutorial teaches it as one thing. Once flag-a-problem (piece 4 or 9) and before-after (piece 5) are proven, write one worked scene that chains them: the problem marked as wrong, then the change, then the fixed state. File it as a build aid that names those recipes, or as a worked scene in the library.

## How to run one piece in a fresh session

Paste this, with the number filled in:

> Do piece N of `product/explainer-cookbook-plan.md`. Follow the steps under "How to run one piece".

The steps:

1. **Start from current main.** Link the studies folder with `node tools/channel-learner/learn.mjs link <worktree root>`. Studies live in `~/Assets/comp-room-studies/channel-study/`, outside every worktree.
2. **Gather and align:** `node tools/channel-learner/learn.mjs gather <url> --out quality/renders/channel-study/<video id>`, then `learn.mjs align` on the same folder.
   - Exit code 3 means YouTube's bot check stopped it. Try again later, and don't retry in a loop.
   - Transcribe with local whisper; the learner does this itself.
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

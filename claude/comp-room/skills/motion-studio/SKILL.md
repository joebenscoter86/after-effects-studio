---
name: motion-studio
description: Create or revise motion graphics in Adobe After Effects using a detailed production-derived motion language. Use whenever the user asks for an explainer, product animation, animated diagram, title sequence, kinetic typography, reel graphics, or more polished AE motion. Adapts to any brand and style; includes measured choreography, camera grammar, worked scenes and visual review.
---

# Motion studio: universal style, a specific craft foundation

The user chooses the subject and visual style. This plugin supplies the detailed motion language developed in an existing production pipeline. Use that knowledge as the default for every motion task; it is not a JoeB-only preset. Native AE control is the execution layer.

For visually demanding builds, suggest the most capable model available in your host. A lower-cost model can still build editable drafts; treat its render as a draft until the delivered frames pass visual review. Do not switch models without the user's choice, and never treat model choice as creative acceptance.

## Cold start

Read `ae_library` documents **motion-language**, **production-workflow**, and **brief-template** before designing the first scene. If the library tool is unavailable but the plugin is on disk, read `../../library/language/core.md`, `../../library/language/production-workflow.md`, and `../../library/templates/brief.md` relative to this skill directory. All required knowledge ships here; never require the original Content repo.

Inspect `ae_version_info` and `ae_context`, or run the plugin's doctor if no connection is available. Determine the target project, viewer takeaway, format, duration and real inputs. Ask only for missing information that changes the output. A blank AE project is supported: explicitly create native comps/layers. Don't assume a personal MASTER rig, asset folder, font or generation account exists.

## Load the technique the scene needs

| Task or problem | Library documents to read |
|---|---|
| Explanation, construction, sort, reveal or state change | construction, worked-scenes; use worked-scenes D for source-to-use transfers |
| Camera, depth, traversal or continuous transition | camera-continuity |
| Product art, illustrated objects, compositing, material polish | assets-depth |
| Animated text and kinetic typography | typography-technique, typography-recipes, typography-examples; sibling typography/SKILL.md |
| Green-screen keying, spill, grading a keyed subject to a plate; making an element sit in its scene (grain, softness, black level, light wrap, a room's colour cast on a cut-out); cutting a person or object out of footage, with or without a green screen | keying |
| Paper collage, cutouts or tactile cardstock | paper-collage-style, paper-collage-recipes, paper-collage-examples; sibling paper-collage/SKILL.md |
| Voiceover, captions, UI, factual evidence | type-evidence |
| Supplied reference or a look that isn't landing | reference-study, failure-atlas |
| Native implementation | scripting, motion-jsx; sibling ae-control/SKILL.md |
| Every review/delivery | review, quality, failure-atlas |

Use ae_library with a document ID. The index returns relative paths for direct reading; load relevant modules, not every historical document. scene-recipes is a quick index; worked-scenes carries actual event/timing studies. timing is a compact lookup alongside construction.

For an animated headline on paper, use the typography capability and paper-collage style together under the same foundation and one scene brief. Keep one owner for native writes; specialists supply guidance, not competing scene builders or a recursive handoff. A typography-only request does not activate collage, and a wordless collage does not require typography. A user-requested palette or pace intentionally overrides a supplied brand default; otherwise preserve the brand constraint, then apply style and general defaults. Project ownership and tool permission boundaries always remain in force. If a material conflict has unclear intent, ask one focused question.

For a native-only type-led collage, read the type-led announcement in `paper-collage-examples` before designing, including its final-pose clearance test. Give the primary paper a visible edge/surface/shadow treatment with `AESCollage.paper` or an equivalent tested native stack, then keep the event name and invitation on readable surviving paper surfaces. Reserve nonoverlapping measured regions for the complete settled strings and place joins behind text or in the gap. A smooth polygon on an almost identical ground or a foreground card covering part of the event name is a failed scene, even when export and text checks pass.

Prove the paper material before animating a full collage. Make one final-size still of the proposed primary sheet over its actual ground and inspect both its interior and edge: visible tonal/fiber variation must survive the delivered encode, a cut or irregular edge must stay legible, and contact plus softer offset shadow must separate it from the backer. If the still reads as a uniform polygon, revise the sheet with `AESCollage.paper` or an equivalent tested treatment before spending the run budget on timing, accents, or repeated layout adjustments. A readable final CTA does not excuse a flat material surface. Retest the settled final movie frame after export because compression can erase subtle grain.

For a causal explainer, verify the source, moving carrier and changed recipient at the actual transition frames. If drawing a route, measure its source/recipient endpoints and keep the carrier on that same geometry at departure, quarters, midpoint and contact; if it cannot register, delete the route and use a direct carrier or matched cut. A disconnected guide or newly appearing stand-in fails the story. For type on paper, inspect whether the piece has a credible material role beyond a flat card and whether the named subject remains clear through the final invitation. Correct the brief and scene geometry when either relationship fails, before polishing easing or grain.

At the final review, compare the delivered movie's hard middle and settled reading frames. In a transfer scene, look for a visible change at the source before the recipient reacts. In a paper scene, measure the title and invitation bounds and move foreground folds/scraps away from glyphs before calling the material treatment finished.

## Apply the language

Create a portable brief in the user's project. Specify the operation, star, start/action/payoff poses, exact text/data, asset plan, event timing, camera purpose and hand-off. Choose typography, palette and material from the request. Retain progressive construction, meaningful state changes, stable identity, deliberate timing and artifact-based review across styles.

When a creator gives a loose brief for a build, produce two distinct deliverables: a concise, plain-language story proposal for the creator and a construction-ready beat plan using `brief-template` for the builder. Save the plan in the user's project or include it as a clearly labeled section after the proposal. A time-range story table is not that plan. If asked to propose motion for approval and stop before AE, finish both deliverables, then stop before native execution; do not ask for story approval while leaving the build plan unwritten. If the user explicitly asks only for ideas, keep the response proportional. Approval of the story alone does not approve build details that were never shown.

Before native execution, the plan settles comp format and viewing rationale, exact on-screen copy, asset/font assumptions, and each beat's start/end time **and frame**, action, resolved pose and reading hold. For difficult hand-offs, identify what persists from source to recipient, the departure/contact/response frames, and frames immediately on both sides of the seam. Name the editable build approach and observable review targets. Mark inferred defaults and genuine blockers.

Use measured values as concrete starting points; adapt with reasons. Do not reduce the language to “add easing” or default to finished cards that pop in and sit. A premium physical object needs suitable artwork; an intentional geometric diagram can be native. Resolve essential missing assets or label a blockout—don't substitute a crude icon and call the result finished.

For a new look, test a bounded hard transition and an ordinary explanatory beat. Preserve approved material. If full execution is authorized, self-review and continue; request creative input when necessary or requested, without imposing extra approval stages.

## Cutting a subject out of footage: one click by the user

When a brief involves cutting a person or object out of footage, with or without a green screen, tell the user before building starts, in the first answer: one manual step in After Effects will be needed, a single click on the subject with After Effects' Object Matte Tool; it comes once the footage is in its comp, before anything is laid over or behind the subject; it takes about ten seconds. A script cannot make that click.

At that point run `subject.prepare` and give the user its `userMessage` word for word: the notice and seven numbered steps, with the clip's name filled in. Do not paraphrase or shorten them. In a plan written before After Effects, quote the seven steps from `keying` ("Tell the user first") as they are.

Two things about the footage come before the click. When `subject.prepare` returns `sourceAdvice` (footage much larger than the comp and scaled down to fit, such as a 4K take in a 1080 × 1920 comp), its `relay` says not to give the steps yet: tell the user its numbers, make the copy at the delivery size (`sourceAdvice.copy` with ffmpeg when it is there; otherwise render the footage alone from After Effects at that size), put it in the comp in the take's place and run `subject.prepare` on the copy. Do it before the click, because replacing footage under a matte freezes it. The edge comes out the same; a render takes about a quarter of the time and the cache drops from about 19 GB to about 5 GB. When it returns `soundAdvice` (more than two channels, or sound After Effects does not report), the take may play as silence: extract the voice with its `extract` line, put the WAV in the comp and switch the take's own audio off. Whatever it returns, measure the take's sound and the delivered file's sound before calling the piece done.

After "done", and before building anything else, run `subject.check`: the quick check near the click frame, which takes seconds. A selection count is not a check. When it returns `stop: true` (a hole or opening of 1,000 px or more not accepted, a frame it could not check, an unstable or frozen frame; close clicks set it only alongside one of these), say so in your reply before your next call: what is out, in plain words, and the path of its picture. Not later, and not only in the final report, even when you judge a finding to be a real gap yourself (then say that too, and why). Then fix it as `keying` says (another click, `subject.remove_selection`, `subject.fill_gaps` for a hole no click fills, or `accept` for a real gap the user calls fine) and check again. Call `subject.fill_gaps` without `only`, so every enclosed gap is filled the first time: a gap under the limit on one frame can grow past it on others, and the second render that catches it costs a minute at half size and five minutes and 19 GB on a 4K source. Openings are never filled, so real gaps at the frame edge are safe; pass `only` only to keep a real enclosed gap (between an arm and the body). When the user asks you to make the click and you have full-screen control, hover each piece, confirm from a screenshot that the magenta tint is on the piece you mean, click, and then run `subject.check`.

Then render the cut-out once with `subject.render_cutout` (tell the user it takes about one pass through the clip, roughly a second a frame on 4K footage), check every frame of the file with `subject.check_file` (on any finding, the same: say what is wrong and the picture's path in your reply before the next call), and build the piece on the file with `subject.use_cutout`. After Effects recomputes the live matte on every render, so a piece built on the live matte can change between renders; the file cannot. The render writes After Effects' disk cache (about 19 GB for 320 frames of a 4K take): say so before it starts, and once the file is checked tell the user to purge it (Edit > Purge > All Memory & Disk Cache) and how much it frees. Delete nothing yourself and change no preference.

For a person, after `subject.check` passes and any fill is in, and before the render, run `subject.soften_edge` with its defaults: it softens the hair's edge the way the user chose (look C in `keying`), checks itself and undoes itself if anything is seen through, tinted or smeared. Tell the user it costs a second Object Matte pass in every render after it (about twice the disk cache and several times the render time: 342 s against 65 to 92 s on the half-size take), and switch any gap fill on before the render (subject.render_cutout refuses when it is off). Then render and run subject.check_file: its check before the render samples only the sixty frames after the click, and the file check reads every frame; a `seen-through` finding means the soft edge let the background through the subject, so undo it (subject.soften_edge with undo: true), switch Decontaminate Edge Colors on, render again and check the new file. When its check fails, or the user wants the hard edge, switch Decontaminate Edge Colors on instead (`subject.settings`). Show the user the hair at twice size over the background before and after. Before calling a cut-out finished, measure whether it sits in its scene with `ae_render_frame` `look` (`keying`, "Sitting an element in its scene"). Over a filmed plate, match the plate's grain and softness and seat the blacks. Over a designed background there is no plate: measure the cast of the room's light on surfaces in the take that should be neutral, correct the cut-out alone, measure again, and show the user a before and an after frame; how far to take it is their call.

## Execute, inspect and deliver

Discover exact operations via ae_catalog. Use this plugin's native tools; no cloud bridge is required. eval.run executes custom ES3. Name owned layers, preserve unrelated work, read back results and inspect uncertain completion before retrying. Portable motion-jsx has no rig, brand or media dependency.

Render first-readable, peak-action, overlap, hold and transition frames. Inspect actual images, fix defects, and render again. Review a playable export for motion rhythm/audio; state plainly if that check cannot be done. A successful script or automated score does not establish premium quality.

## Review before you say it is done

Do not say a build is done, finished or ready until this step is complete. Read `review` through `ae_library` for the details.

1. Run `ae_check_comp` on the delivered comp, repeating with `next.startFrame` until `next` is null. Fix what is plainly wrong and re-run it.
2. Render the moments that matter as files: `ae_render_frame` strips around each cut and hit, full-size stills of each reading hold, and a preview movie (`render.preview`) where the host can play one.
3. Hand the review to a reviewer that did not build the piece, with only the brief, the report and its sheet, and those file paths; not your notes, reasoning or list of fixes. In Claude Code, delegate to the plugin's agent `comp-room:motion-reviewer`. In another host that can start a fresh agent, start one with the motion-review skill and the same material. If the host cannot, do a frames-only pass yourself: judge only from the brief, the report and the frames, and say in the hand-over that the review was not independent.
4. Fix what the review found, re-run `ae_check_comp`, re-render the changed moments and review again with that fresh evidence. Stop after two review passes, or sooner when nothing is left at `first-watch` or `careful-watch`.
5. Hand over as `review` describes: what was found, what was fixed, what was left and why (each `ae_check_comp` flag fixed or named as intended, with its reason), and what nobody could check.

Deliver editable project/assets and the requested verified export. Separate technical validation, visual judgment and user approval. Record accepted recipes in the user's project with timings and evidence.

## Optional style and legacy integrations

joeb-preset contains the paper/navy/vermilion appearance. Use only when requested or established. The craft modules above remain active for all other aesthetics. house-jsx and joeb-motion-jsx need a compatible rig, paths and media; don't use them to initialize a blank universal scene.

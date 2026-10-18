---
name: motion-studio
description: Create or revise motion graphics in Adobe After Effects using a detailed production-derived motion language. Use whenever the user asks for an explainer, product animation, animated diagram, title sequence, kinetic typography, reel graphics, or more polished AE motion. Adapts to any brand and style; includes measured choreography, camera grammar, worked scenes and visual review.
---

# After Effects Studio: universal style, a specific craft foundation

The user chooses the subject and visual style. This plugin supplies the detailed motion language developed in an existing production pipeline. Use that knowledge as the default for every motion task; it is not a JoeB-only preset. Native AE control is the execution layer.

For visually demanding builds, suggest an available GPT-6-family model or newer; prefer GPT-6.1 Sol or GPT-6 Astra for complex layout and continuity. If the user is on a lower-cost model, continue the requested work and treat its render as a draft until the delivered frames pass visual review. A local comparison found GPT-5.6 Luna/high technically capable but visually unreliable on three of six first passes; GPT-6 Astra/high cleared the sampled faults in separate confirmations. Do not claim that every GPT-6 variant is validated, switch models without the user's choice, or equate model selection with creative acceptance.

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
| Paper collage, cutouts or tactile cardstock | paper-collage-style, paper-collage-recipes, paper-collage-examples; sibling paper-collage/SKILL.md |
| Voiceover, captions, UI, factual evidence | type-evidence |
| Supplied reference or a look that isn't landing | reference-study, failure-atlas |
| Native implementation | scripting, motion-jsx; sibling ae-control/SKILL.md |
| Every review/delivery | quality, failure-atlas |

Use ae_library with a document ID. The index returns relative paths for direct reading; load relevant modules, not every historical document. scene-recipes is a quick index; worked-scenes carries actual event/timing studies. timing is a compact lookup alongside construction.

For an animated headline on paper, use the typography capability and paper-collage style together under the same foundation and one scene brief. Keep one owner for native writes; specialists supply guidance, not competing scene builders or a recursive handoff. A typography-only request does not activate collage, and a wordless collage does not require typography. A user-requested palette or pace intentionally overrides a supplied brand default; otherwise preserve the brand constraint, then apply style and general defaults. Project ownership and tool permission boundaries always remain in force. If a material conflict has unclear intent, ask one focused question.

For a native-only type-led collage, read the type-led announcement in `paper-collage-examples` before designing, including its final-pose clearance test. Give the primary paper a visible edge/surface/shadow treatment with `AESCollage.paper` or an equivalent tested native stack, then keep the event name and invitation on readable surviving paper surfaces. Reserve nonoverlapping measured regions for the complete settled strings and place joins behind text or in the gap. A smooth polygon on an almost identical ground or a foreground card covering part of the event name is a failed scene, even when export and text checks pass.

Prove the paper material before animating a full collage. Make one final-size still of the proposed primary sheet over its actual ground and inspect both its interior and edge: visible tonal/fiber variation must survive the delivered encode, a cut or irregular edge must stay legible, and contact plus softer offset shadow must separate it from the backer. If the still reads as a uniform polygon, revise the sheet with `AESCollage.paper` or an equivalent tested treatment before spending the run budget on timing, accents, or repeated layout adjustments. A readable final CTA does not excuse a flat material surface. Retest the settled final movie frame after export because compression can erase subtle grain.

For a causal explainer, verify the source, moving carrier and changed recipient at the actual transition frames. If drawing a route, measure its source/recipient endpoints and keep the carrier on that same geometry at departure, quarters, midpoint and contact; if it cannot register, delete the route and use a direct carrier or matched cut. A disconnected guide or newly appearing stand-in fails the story. For type on paper, inspect whether the piece has a credible material role beyond a flat card and whether the named subject remains clear through the final invitation. Correct the brief and scene geometry when either relationship fails, before polishing easing or grain.

At the final review, compare the delivered movie's hard middle and settled reading frames. In a transfer scene, look for a visible change at the source before the recipient reacts. In a paper scene, measure the title and invitation bounds and move foreground folds/scraps away from glyphs before calling the material treatment finished.

## Apply the language

Create a portable brief in the user's project. Specify the operation, star, start/action/payoff poses, exact text/data, asset plan, event timing, camera purpose and hand-off. Choose typography, palette and material from the request. Retain progressive construction, meaningful state changes, stable identity, deliberate timing and artifact-based review across styles.

Use measured values as concrete starting points; adapt with reasons. Do not reduce the language to “add easing” or default to finished cards that pop in and sit. A premium physical object needs suitable artwork; an intentional geometric diagram can be native. Resolve essential missing assets or label a blockout—don't substitute a crude icon and call the result finished.

For a new look, test a bounded hard transition and an ordinary explanatory beat. Preserve approved material. If full execution is authorized, self-review and continue; request creative input when necessary or requested, without imposing extra approval stages.

## Execute, inspect and deliver

Discover exact operations via ae_catalog. Use this plugin's native tools; no cloud bridge is required. eval.run executes custom ES3. Name owned layers, preserve unrelated work, read back results and inspect uncertain completion before retrying. Portable motion-jsx has no rig, brand or media dependency.

Render first-readable, peak-action, overlap, hold and transition frames. Inspect actual images, fix defects, and render again. Review a playable export for motion rhythm/audio; state plainly if that check cannot be done. A successful script or automated score does not establish premium quality.

Deliver editable project/assets and the requested verified export. Separate technical validation, visual judgment and user approval. Record accepted recipes in the user's project with timings and evidence.

## Optional style and legacy integrations

joeb-preset contains the paper/navy/vermilion appearance. Use only when requested or established. The craft modules above remain active for all other aesthetics. house-jsx and joeb-motion-jsx need a compatible rig, paths and media; don't use them to initialize a blank universal scene.

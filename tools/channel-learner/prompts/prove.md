# Building a technique from its recipe in After Effects

You test whether a written recipe is enough to rebuild a technique. You get the recipe and nothing else from the video: do not open the video, its frames or the timeline. If the recipe leaves you guessing, that is a finding: build your best reading and say exactly what was missing.

## What you are given

- The recipes to build (paths), the proof folder `PROOF` and the scripts folder `SCRIPTS`.
- `SCRIPTS/prelude.jsx`: helpers (`P.freshComp`, `P.solid`, `P.text`, `P.shape`, `P.ellipse`, `P.path`, `P.stroke`, `P.dashes`, `P.effect`, `P.tf`). Read it first. Add a helper there only when two techniques need it.
- `SCRIPTS/01-dotted-line.jsx`: a finished example.
- The Comp Room plugin's After Effects tools. Load them with ToolSearch (`select:mcp__plugin_comp-room_comp-room__ae_do,mcp__plugin_comp-room_comp-room__ae_render_frame,mcp__plugin_comp-room_comp-room__ae_catalog,mcp__plugin_comp-room_comp-room__ae_layer_info,mcp__plugin_comp-room_comp-room__ae_comp_info,mcp__plugin_comp-room_comp-room__ae_project_info,mcp__plugin_comp-room_comp-room__ae_save_project`).

## Rules for After Effects

- You are the only one driving After Effects right now. The open project must be `PROOF/proofs.aep`; check with `ae_project_info` before the first write, and stop and report if it is anything else. Never open, close or create a project. Never touch comps you did not make, except to read them.
- One comp per technique, named `<n> <short name>`, 1080 by 1920 (9:16, the phone frame the owner reviews on), 24 frames a second unless the recipe says otherwise, 3 to 6 seconds. Use our own stand-in content: text, shapes, solids, gradients. No downloaded assets.
- Prefer a dedicated plugin operation (`ae_catalog`) when one exists; otherwise write ExtendScript in `SCRIPTS/<n>-<slug>.jsx` and run it with `ae_do` `eval.run` `{ file, args: { prelude: "<SCRIPTS>/prelude.jsx" } }`. Scripts must be re-runnable (`P.freshComp` removes the earlier comp). ExtendScript is ES3: no `let`, arrow functions or template strings. After `addProperty`, fetch properties again by name or index; old references go stale.
- Do not call undo. Do not use the render queue except through `render.preview`. Leave project settings alone (8 bits per channel).
- Menu commands that open a dialog are off limits. If a step can only be done by hand in the interface, say so and build the same result another way (keyframes, properties), marked as a substitute.
- Save with `ae_save_project` (no path) after each technique.

## For each technique

1. Read the recipe. Write the script. Run it. Fix errors.
2. Render: a still technique gets `PROOF/<n>/build.png` (`ae_render_frame`); an animated one also gets `PROOF/<n>/build.mov` with `ae_do` `render.preview` `{ comp, outputPath, span: "comp", overwrite: true }` (raise `timeoutMs`).
3. Look at your render. Does it show what the recipe's "what it looks like" describes? Fix what is yours to fix.
   - When the technique is a finish or a fix (a glow, a shadow, a sharper precomp, an effect no longer cut off), also render the same frame with the technique switched off as `PROOF/<n>/before.png`, so the difference it makes can be seen. Switch it back on afterwards.
   - The tutorial's examples use finished artwork; yours will be plain stand-ins. Build the stand-in so the technique is easy to judge (a shadow needs a surface to fall on, a focus lock needs layers at different depths), but do not spend time on decoration.
4. Write `PROOF/<n>/build-notes.md`: what you built, each place the recipe was unclear or silent and what you assumed, every step you could not do through the plugin's own operations (name the missing operation), and anything substituted.

Finish with one line per technique: built or not, and the main gap in the recipe or in the plugin.

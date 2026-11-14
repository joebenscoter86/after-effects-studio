# Running a technique's build script in After Effects

The build scripts were written from the recipes alone, without After Effects (`prove-author.md` beside this file). You run them, fix them and render them. You stay blind to the video: read the recipe and the script's notes, never the video, its frames, the timeline, the checks or anything named `reference.*`. If the recipe leaves you guessing, build your best reading and say what was missing.

## What you are given

- `SCRIPTS` (the scripts, `prelude.jsx`, and `01-dotted-line.jsx`, which has run successfully), `PROOF` (one folder per technique, each with `build-notes.md`), the recipes, and your technique numbers.
- The Comp Room plugin's After Effects tools. Load them with ToolSearch (`select:mcp__plugin_comp-room_comp-room__ae_do,mcp__plugin_comp-room_comp-room__ae_render_frame,mcp__plugin_comp-room_comp-room__ae_catalog,mcp__plugin_comp-room_comp-room__ae_layer_info,mcp__plugin_comp-room_comp-room__ae_comp_info,mcp__plugin_comp-room_comp-room__ae_project_info,mcp__plugin_comp-room_comp-room__ae_save_project`).

## Rules for After Effects

- You are the only one driving After Effects. The open project must be `PROOF/proofs.aep`: check with `ae_project_info` before your first write, and stop and report if it is anything else. Never open, close or create a project. Never touch comps you did not make, except to read them.
- **One call at a time.** Never send a call while another is pending, and never send calls in parallel. If a call is slow, wait for it; do not send another on top of it (the installed plugin can raise a blocking dialog when two launches overlap). After an error, read it before the next call.
- If a call times out or reports a dialog, call `ae_do` `instance.dialogs` once. If a dialog is open, stop and report its text; do not dismiss it.
- Do not call undo or redo. Use the render queue only through `render.preview`. Leave project settings alone.
- Menu commands that open a dialog are off limits.
- Save with `ae_save_project` (no path) after each technique.

## For each technique, in number order

1. Read the recipe, including its `layout:` line (sizes measured on the tutorial's picture; the script was written before that line existed, so correct the script's assumed sizes to match it), then the script and its `// VERIFY:` list and `PROOF/<n>/build-notes.md`.
2. Run it: `ae_do` `eval.run` `{ file: "<SCRIPTS>/<n>-<slug>.jsx", args: { prelude: "<SCRIPTS>/prelude.jsx" } }`. Fix what fails, in the script, with the smallest change (ExtendScript is ES3; after `addProperty` fetch properties again). Scripts are re-runnable: `P.freshComp` removes the earlier comp. Resolve each VERIFY item as you meet it (use `ae_catalog`, `effect.describe`, `ae_layer_info` to look things up) and correct the script.
3. Render with `ae_render_frame`: `PROOF/<n>/build.png` at a moment that shows the technique. When the technique is a finish or a fix, also `PROOF/<n>/before.png` with it switched off (the notes say how: layers or effects named `TECH ...`, or `args.before`), then switch it back on. For an animated technique also write `PROOF/<n>/build.mov` with `ae_do` `render.preview` `{ comp, outputPath, span: "comp", overwrite: true }` (raise `timeoutMs`), as the last thing you do for that technique.
4. Look at your render. Does it show what the recipe's "what it looks like" and `layout:` describe? Fix what is yours to fix; two or three rounds at most.
5. Append a section `## Run` to `PROOF/<n>/build-notes.md`: what ran; each fix you made to the script and why; each VERIFY item and what turned out true; where the recipe was unclear or silent and what you assumed; each step that has no plugin operation and needed raw scripting (name the operation the plugin lacks); anything substituted; and whether your render shows the technique.

## Report (at most 12 lines)

Per technique: built or not, one line on what the render shows, and the main gap in the recipe or the plugin. Then anything that stopped you.

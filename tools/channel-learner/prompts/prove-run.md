# Running a technique's build script in After Effects

The build scripts were written from the recipes alone, without After Effects (`prove-author.md` beside this file). You run them, fix them and render them. You stay blind to the video: read the recipe and the script's notes, never the video, its frames, the timeline, the checks or anything named `reference.*`. If the recipe leaves you guessing, build your best reading and say what was missing.

## What you are given

- `SCRIPTS` (the scripts, `prelude.jsx`, and `01-dotted-line.jsx`, which has run successfully), `PROOF` (one folder per technique, each with `build-notes.md`), the recipe, and your one technique number. Each run builds one technique; the next technique gets a fresh run.
- The Comp Room plugin's After Effects tools. Load them with ToolSearch (`select:mcp__plugin_comp-room_comp-room__ae_do,mcp__plugin_comp-room_comp-room__ae_render_frame,mcp__plugin_comp-room_comp-room__ae_catalog,mcp__plugin_comp-room_comp-room__ae_layer_info,mcp__plugin_comp-room_comp-room__ae_comp_info,mcp__plugin_comp-room_comp-room__ae_project_info,mcp__plugin_comp-room_comp-room__ae_save_project`).

## Rules for After Effects

- You are the only one driving After Effects. The open project must be `PROOF/proofs.aep`: check with `ae_project_info` before your first write, and stop and report if it is anything else. Never open, close or create a project. Never touch comps you did not make, except to read them.
- **One call at a time.** Never send a call while another is pending, and never send calls in parallel. If a call is slow, wait for it; do not send another on top of it (the installed plugin can raise a blocking dialog when two launches overlap). After an error, read it before the next call.
- If a call times out or reports a dialog, call `ae_do` `instance.dialogs` once. If a dialog is open, stop and report its text; do not dismiss it.
- Do not call undo or redo. Use the render queue only through `render.preview`. Leave project settings alone.
- Menu commands that open a dialog are off limits.
- Save with `ae_save_project` (no path) after each technique.

## For your technique

0. If `PROOF/<n>/art/brief.md` exists, the comp is built with that artwork. Read the brief: it says what each file in `PROOF/<n>/art/` is, its layer name, position, scale, depth and blend, the layer order, palette and fonts. Import the files (`ae_do` import operations, or `app.project.importFile` in the script), put them in a project folder `art <n>`, and build the technique on them as the recipe says. The art serves the technique: where the brief and the recipe disagree on what the technique does, follow the recipe and say so; where they disagree on composition (placement, colour, type), follow the brief. Look at your render as a designer would: does it look finished and premium, and does the technique read clearly on the art? The brief may describe the reference's look no further than the art needs; it never replaces the recipe. **The recipe's measured effect is fixed** (a shadow's darkness as a share of its floor, a streak's length, a spread angle, a fog's lift, an edge's fray): if the effect looks wrong on the art, change the art or the layout (darken or lighten a plate, move a layer, scale the scene), never the technique's values, and write the clash in the notes. After placing the art, measure your render against the recipe's figures again; earlier art builds drifted on 12, 14, 15, 17 and 21 (`../LESSONS.md` lesson 12).
1. Read the recipe, including its `layout:` line (sizes measured on the tutorial's picture; the script was written before that line existed, so correct the script's assumed sizes to match it), then the script and its `// VERIFY:` list and `PROOF/<n>/build-notes.md`.
2. Run it: `ae_do` `eval.run` `{ file: "<SCRIPTS>/<n>-<slug>.jsx", args: { prelude: "<SCRIPTS>/prelude.jsx" } }`. Fix what fails, in the script, with the smallest change (ExtendScript is ES3; after `addProperty` fetch properties again). Scripts are re-runnable: `P.freshComp` removes the earlier comp. Resolve each VERIFY item as you meet it (use `ae_catalog`, `effect.describe`, `ae_layer_info` to look things up) and correct the script.
3. Render with `ae_render_frame`: `PROOF/<n>/build.png` at a moment that shows the technique, at the comp's full size (the reviewer's crops are cut from it), with `contactSheet: { thumbWidth: 512 }` so the same call writes `PROOF/<n>/build_sheet.png`. When the technique is a finish or a fix, also `PROOF/<n>/before.png` with it switched off (the notes say how: layers or effects named `TECH ...`, or `args.before`), then switch it back on. For an animated technique also write `PROOF/<n>/build.mov` with `ae_do` `render.preview` `{ comp, outputPath, span: "comp", overwrite: true }` (raise `timeoutMs`), as the last thing you do for that technique.
4. Look at your render as one small picture: open `PROOF/<n>/build_sheet.png` (512 wide), never the full-size `build.png` whole. For an animated technique, render four moments in one call (`times` at 1/8, 3/8, 5/8 and 7/8 of the comp, `outPath: PROOF/<n>/look/frame.png`, `contactSheet: { columns: 2, thumbWidth: 256 }`) and look at that one sheet. When a figure needs more detail than the sheet shows (a shadow's darkness as a share of its floor, a streak's length, an angle), read it from numbers (`ae_render_frame` `sample` or `analyze`) or cut one crop of the full-size `build.png` at that place (`ffmpeg -loglevel error -y -i PROOF/<n>/build.png -vf crop=W:H:X:Y PROOF/<n>/look/<name>.png`, at most 400 by 400) and look at that crop: one crop per figure. Does it show what the recipe's "what it looks like" and `layout:` describe, as a whole picture and not only on the one layer the steps name? If the recipe describes several objects carrying the effect, shadows between them, or a shaded background, build those too: they are part of the technique's look, not decoration. If the recipe is silent on whether the other objects carry the effect, apply it to all like objects and say so. A render in which the technique "reads more as a tint than as the thing described" is not done: say what the recipe would need to tell you to close it. Fix what is yours to fix; two or three rounds at most, each looked at the same small way.
5. Append a section `## Run` to `PROOF/<n>/build-notes.md`: what ran; each fix you made to the script and why; each VERIFY item and what turned out true; where the recipe was unclear or silent and what you assumed; each step that has no plugin operation and needed raw scripting (name the operation the plugin lacks); anything substituted; and whether your render shows the technique.

## What earlier builds learned

- Edit a script, confirm the edit applied, then run it: never an After Effects call in the same turn as a file edit, and never more than one After Effects call in a turn.
- Address comps and layers by name or id in every call, never "active" or "selected": the active comp can change between calls.
- On a comp-sized shape or text layer an effect's point control reads comp pixels; on a smaller precomp layer it reads the layer's own space. Test with a fixed value before trusting an expression (`fromComp` put a gradient off its disc and a blur centre in a corner).
- CC Radial Fast Blur appears to stop its Center at the frame's edge: centres farther out render identically.
- Place cameras explicitly. Match names that cost a round: `ADBE Rotate Z` (not `ADBE Rotation`), `ADBE FOG_3D`, `ADBE Easy Levels`.
- A font found by name may be a substitute: check `isSubstitute`, fall back to an installed face, and say so.
- A layer style can be added by menu command when it opens no dialog (Bevel and Emboss 9004, Gradient Overlay 9007) after selecting the layer by script. Gradient Overlay colours and Curves points cannot be set by script: use the closest scriptable substitute and say so.
- Fog 3D depths, apertures and blur centres do not carry over from the tutorial's scene: aim for the effect the recipe measures, and record the values that reached it.
- A reviewer's suggested value is an estimate. Aim for the target it describes, measure your own render, and report when the suggestion goes the wrong way.
- Each re-run leaves orphan solids; remove only your own.
- `render.preview` with `span: "comp"` on a 23.976 fps comp (duration 5.005 s, 120 frames) wrote 121 frames, the last one blank past the layers; give an explicit span instead (`timeSpanStart: 0`, `timeSpanDuration` the whole seconds, e.g. 5.0, which rounds to the comp's 120 frames) and check the frame count with ffprobe.

## Report (at most 12 lines)

For your technique: built or not, one line on what the render shows, and the main gap in the recipe or the plugin. Then anything that stopped you.

# Authoring handoff

Files: `build.jsx` is the **function body** to pass to the plugin's `eval.run`; `brief.md` is the production specification. This test did not operate AE.

The body needs an already open project, including an empty unsaved one. It adds one new uniquely named 9-second, 1280×720, 30fps comp with native editable layers. It performs no imports, external reads, saves, project open/new/close, deletion, viewer switching or nested undo grouping. The created comp ID is returned as `compIds`. The function relies only on native AE globals, not a private MASTER rig or an external helper file.

Read live version/context and the current catalog before eventual execution. Run once, retain the result, and inspect that exact returned comp and its expected six IDs. If an exception/time-out occurs, inspect what was created before deciding whether to run again. ArialMT is a requested common font; inspect `fontReadbacks`, actual text bounds and glyphs on the target host. Do not infer fonts from the source alone.

No AE validation, render, playback or export was performed. Render the review frames and dense transfer strip listed in the brief. First scrutinize the six constructions and the shared R05-then-R02 carry, plus the final four/two count and ID continuity. Rendered stills must establish readability and collision freedom; playback must establish rhythm. Authoring success is not visual approval.

If a project file or video is later requested, save deliberately to a user-designated path, render the tested composition using available host templates, and verify duration/resolution/fps plus a full decode. Such writes are outside this test and not embedded in the build.

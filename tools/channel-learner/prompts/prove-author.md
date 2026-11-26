# Writing a technique's build script from its recipe, without After Effects

After Effects is not available to you. You write the scripts now; someone else runs and fixes them later. The test is the same as in `prove.md` beside this file: can the technique be rebuilt from the written recipe alone? So you get the recipe and nothing else from the video: do not open the video, its frames, the timeline or the checks.

## What you are given

- The recipes to build (paths), the proof folder `PROOF` and the scripts folder `SCRIPTS`.
- `SCRIPTS/prelude.jsx`: helpers. Read it first. Do not edit it (others are writing scripts at the same time); if you need another helper, define it at the top of your own script and name it in your notes as a candidate for the prelude.
- `SCRIPTS/01-dotted-line.jsx`: an example that has run successfully in After Effects 2027.
- `prove.md`: read its rules for comps, stand-in content and what a script may do. Everything there applies except running and rendering.

## Rules

- One script per technique: `SCRIPTS/<n>-<slug>.jsx`, run later as a function body with `args` (`args.prelude` is the prelude's path; start with `$.evalFile(args.prelude);`) and ending in `return { comp: c.name, ... };`.
- File paths in a script come from `args` (art from `args.artDir` or `args.art`), or start with `~/`; never a home folder spelled out (`/Users/<name>/...`). The scripts are committed to a public repository.
- ExtendScript, ES3: `var` only, no arrow functions, no template strings, no `let`/`const`, no trailing commas, no `Array.prototype.forEach/map`, no `JSON` unless you guard it. After any `addProperty`, fetch properties again by name or index.
- One comp per technique, named `<n> <short name>`, 1080 by 1920 (9:16: the owner reviews proofs on a phone; a 16:9 scene is framed for it as `prove-run.md` says under "What earlier builds learned"), 24 frames a second unless the recipe says otherwise, 3 to 6 seconds, our own stand-in content (text, shapes, solids, gradients made from effects such as Gradient Ramp).
- When the technique is a finish or a fix, build it so it can be switched off: put the technique's effects or layers under names starting with `TECH ` so the runner can disable them for a "before" frame.
- Use an effect's English display name with `P.effect(layer, "<name>")` (it throws when the effect is missing) unless you are certain of the match name. Set effect properties by the display names the recipe gives.
- You cannot test. So: keep each script simple and linear; wrap nothing in try/catch that would hide an error; and put at the top of the script a comment block `// VERIFY:` listing every After Effects name, enum number or behaviour you are unsure of, one per line, so the runner knows where to look first.
- Steps that can only be done by hand in the interface (a menu command with a dialog, a live recording, a drag gesture) get the same result built another way (properties, keyframes, expressions), marked `// SUBSTITUTE:` with what it stands in for.
- Follow the recipe's values. Where the recipe says a value is unknown, choose one and mark it `// ASSUMED:`.

## Output

- `SCRIPTS/<n>-<slug>.jsx` for each technique.
- `PROOF/<n>/build-notes.md`: what the script builds; each place the recipe was unclear or silent and what you assumed; each step that has no plugin operation and needed raw scripting; anything substituted.

Finish with a report of at most six lines: scripts written, and the one or two recipe gaps that cost you most.

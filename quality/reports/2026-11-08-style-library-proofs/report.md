# 2026-11-08 — Style library: sampled builds through the Claude package (CL-9 Task 5)

- Scenario ID and requirement/ticket: CL-9 Task 5 in [claude-style-library-plan.md](../../../product/claude-style-library-plan.md). One style per tier, each built as a new five-second scene about a neutral subject, rendered and checked against its STYLE.md.
- Operator and prior familiarity: Claude (Opus 5.5) in the Claude desktop app's Code tab; author of the package and of the import.
- Date/time zone; machine/OS build; host build; AE build; Node build: 2026-11-08 America/Los_Angeles; Joe's MacBook Air, personally owned, not MDM-enrolled (not the company-managed Mac of D-011); macOS 26.6.2 (25G83); Claude Code CLI 2.1.302; After Effects 2027 27.0x78; Node 25.9.0; Blender 5.2.2 LTS; ffmpeg 8.0.1.
- Source revision: `e62b7e8` on `claude/after-effects-anthropic-plugin-491bba`; package `claude/after-effects-studio` 0.2.0 as committed.
- Renders: `quality/renders/2026-11-08-style-library-proofs/<style>/` (git-ignored), one contact sheet per style.

## Route

The plan asks for a fresh `claude -p` session per style. The Claude Code CLI's own login has expired (`claude auth status`: not logged in; `claude -p`: "OAuth session expired and could not be refreshed"), so no headless session could run. Instead the operator played the session's part through the package itself: a small MCP client started the packaged server exactly as Claude Code does (`node ${CLAUDE_PLUGIN_ROOT}/start.mjs`, plugin root substituted, a foreign working folder, `AE_MCP_READONLY=0`), and every After Effects call went through its tools (`ae_context`, `ae_do` with `eval.run` and native operations, `ae_render_frame`). The build code followed the `visual-styles` skill as written: helpers and module loaded with `$.evalFile` in the same `eval.run` call as the build, the style's own helpers used, fonts checked by the module's `fontOK()`, tools run from the package's `library/styles/<id>/tools/`.

What this proves: the packaged server, library paths, modules, tools and skill instructions work on After Effects 2027. What it does not prove: that a fresh Claude session picks the skill and builds the scene unaided. That check stays open in CL-5 until the CLI login is refreshed.

## Preflight and ownership

- Open project at the start: untitled, unsaved, not dirty, 0 items (Joe had closed his reel and said After Effects was free).
- One controller: a Higgsfield bridge proxy process was running in the background; it was not used, and no other controller sent commands during the run.
- Owned items: every comp, precomp, solid and footage item each build created, named with a `CL9` prefix; each was removed by ID after its frames were saved, and the item count returned to 0 after each style.
- End state: `project.new` without saving returned After Effects to an untitled, unsaved, clean project with 0 items, the same as the preflight.

## Results

| Style | Tier | Scene | Build | Frames | Check against STYLE.md | Result |
|---|---|---|---|---|---|---|
| `dark-keynote` | native | A notes app that saves as you type: typed label, light-revealed headline with a blinking caret, a window that opens on the beat with a typed line, a toast caption, a number locking out of glyph noise in the accent | 33 layers, 1.4 s | 7 frames, 8.6 s | Near-black stage with the hairline grid, cool glow and vignette; one lime accent; Inter Tight and IBM Plex Mono; light reveal; CRT on and off; no window controls or real interface | Pass |
| `paper-lantern` | print | "Home before dark": a night village box whose lamp lights the sheets back to front and the windows one by one, a gold card title wiped in from its edge, a seal stamp, a slow push | 27 layers over two comps, 0.8 s | 7 frames, 6.5 s | Value ladder back light to front dark; Bevel rim and drop shadow on every sheet; moon and windows emissive; fibre grain, pulp and vignette over the box | Pass after one revision |
| `midcentury-toon` | painterly | "Let's grow a sunflower": the presenter points the step out, a script kicker writes on, the slab title slides in on twos over its mustard plate, the printed picture stamps on in its round window with a medallion and a tag | 30 layers over four comps, 1.3 s | 7 frames, 7.1 s | Flat printed colour off a broken ink line; cast on twos with a line boil; paper tooth and warm vignette; the cel tool printed a still (`cel.mjs --still`, 0.14 s) in four inks | Pass |
| `lowpoly-island` | 3d | "Garden notes": the shared seven-beat format compressed into five seconds, written as the user's own `scene.json` and `words.json`, with a local test clip on the island's screen | Blender plate 150 frames at 16 samples in 1 min 17 s (`plate.mjs`); After Effects build 33 layers, 0.9 s | 7 frames, 6.4 s | Faceted hex island growing from the sea, the clip corner-pinned onto the screen, day to dusk to night, the lighthouse beam and lit windows; title risers in Josefin Sans | Pass, with the findings below |

The painterly still came from a macOS sample picture (`/Library/User Pictures/Flowers/Sunflower.heic`, converted with `sips`). It was used only as a local test input and is not in the repository or the package.

## Failures, corrections and findings

- **Paper lantern, my layout (corrected):** the first build put the seal on top of the end of the second title line and a caption across the moon's ripples. Both were scene choices, not module faults. The rebuild moved the seal under the title and dropped the caption (the words were already paper in the picture). The second render passed.
- **Low-poly island, test-scene lines (skill fixed):** `buildScene` writes the test scene's captions into the film ("Three pieces build one picture.", "Here's a real frame from my video.", "Then one thing becomes the next."). The skill already said `buildScene` is a worked example. But the 3D plates require the seven-beat format, so a user's scene naturally goes through `buildScene`. The skill now says its captions and labels are the test scene's own lines, written into the module, and must be replaced. A test pins the wording.
- **Low-poly island, pacing:** the module's offsets assume about ten seconds for seven beats. At five seconds the number label never appears (it starts 0.75 s into a 0.7 s beat), and the end title is still rising at the last frame. The skill now asks for at least a second per beat. A ten-second island was not rebuilt.
- **Mid-century cartoon, a small API gap (not fixed):** `gestures(sh, start, list)` needs the right shoulder point, but the module does not export it (`SH`). The build copied the value `[50, -548]` from the module text.
- **Dark keynote:** the reveal's light band shows as a soft grey block just left of the headline before the sweep starts (frame at 0.45 s). This is the module's own behaviour in `buildScene`, as designed ("a soft additive band travels with the front"); noted for Joe's visual review.

## Evidence recorded

- `plugin/library/styles/index.json`: `pluginProof` for `dark-keynote`, `paper-lantern`, `midcentury-toon` and `lowpoly-island` is `{ date: "2026-11-08", report: this file, technical: "passed", visual: "not-reviewed" }`. The other 26 styles stay `null`. The importer keeps these entries across re-imports.
- `plugin/library/modules.json`: `visual-styles` evidence `technical` is `passed`, with this report. `visual` stays `not-reviewed` until Joe looks at the renders.

## Still open

- Done after the CLI login was refreshed: a fresh session given only "make it look like a slick dark software keynote" loaded `motion-studio`, found `dark-keynote` through the library index and built a new scene with it in After Effects ([CL-5 report](../2026-11-08-claude-local-validation/report.md), third run). `visual-styles` itself did not load: the request described the look rather than naming it, and a question about which styles to use was answered from the skill's description.
- Joe's visual review of the four contact sheets.
- The other 26 styles have Content's proof only (`contentProof`), not a plugin build.

# Comp Room

Comp Room is a plugin for Adobe After Effects. Working from Claude, it creates and revises editable motion graphics in your own copy. The plugin pairs native After Effects control with a bundled, production-derived motion language: briefs, construction, camera continuity, typography, paper collage, worked scenes and visual review. You choose the subject, brand and style. The plugin builds native, editable compositions and shows you rendered frames so you can judge the result before you accept it.

Published by JB Technology LLC. Free for personal and paid client work, including delivery of editable projects. Terms are in [LICENSE](LICENSE). The upstream runtime and bundled dependencies keep their own licenses: see [PROVENANCE.md](PROVENANCE.md), `runtime/LICENSE` and [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).

## Requirements

- macOS with a licensed copy of Adobe After Effects 2027.
- Node.js 24 or newer, installed with the installer from [nodejs.org](https://nodejs.org). Check with `node -v`. The Claude desktop app may not find a Node installed with Homebrew or nvm.
- Claude Code, or a Cowork session running on your Mac (see below).
- macOS asks once whether Claude, or the terminal that runs it, may control After Effects. Allow it. For renders and exports, After Effects needs **Allow Scripts to Write Files and Access Network** turned on in Preferences → Scripting & Expressions.
- Optional: `ffmpeg` and `ffprobe` for the bundled export verifier, for the server's footage operations (reading a movie, checking a delivered file's sound) and for the footage tools most visual styles use; Blender for the four 3D styles (backrooms, glass product, low-poly island and tilt-shift).
- Fonts: each visual style names the free (OFL) Google Fonts families it uses. None are bundled; install the ones a style needs, or let Claude substitute a similar installed family.

## Where it works

| Where | What you get |
|---|---|
| Claude Code on your Mac | After Effects control, plus the skills and motion library |
| A Cowork session running on your Mac | The same as Claude Code. The first time, macOS asks whether Claude may control After Effects |
| Regular Claude chat, or Cowork running in the cloud | The skills only. After Effects control needs a session on the Mac that runs After Effects; there is no cloud relay |

## What it runs and sends

- **A local server.** Claude runs the plugin's `start.mjs` with Node, which starts the bundled server in `runtime/` and talks to Claude over standard input and output. It opens no network port, uses no cloud relay and needs no account.
- **After Effects scripting.** The server asks macOS to run scripts in After Effects and exchanges temporary request and response files with it in a per-user temporary folder. So that only one script reaches After Effects at a time, from any number of sessions, it keeps a small lock file in `~/Library/Caches/comp-room/` while a script runs (`AE_MCP_LAUNCH_LOCK_DIR` moves it). The file holds a random token, two process ids, a request id and a time, nothing from your project, and is removed when the script ends.
- **Footage tools in the server.** When `ffmpeg` and `ffprobe` are installed, some operations run them on files you name: to read a movie for reference measuring and for taking a reference's motion apart, to check a delivered file's size, rate and sound, and to count a take's sound channels. They run on your Mac and send nothing anywhere.
- **After Effects dialogs.** When a modal dialog blocks scripting, the server reads its text to report it, which needs macOS Accessibility permission for the app running Claude. The `instance.dismiss_dialog` operation can close such a dialog by its cancel action (what Escape does) or press the only button of a one-button warning; it never answers a save prompt with Save or Don't Save.
- **Write access, on by default.** Through its tools, Claude can create, change and delete items in the open project; open, close and save projects; render frames and movies to paths you choose; run After Effects menu commands; change After Effects preferences; and start or stop After Effects.
- **Style tools.** Most visual styles include small Node scripts that prepare your footage or stills with ffmpeg, and the 3D styles render plates with Blender. Claude runs one only when a build needs it; it reads the input files you name and writes to a cache folder you choose, replacing its own earlier outputs there. The 3D plate scripts render the library's seven-beat test scene format, so a scene of your own means adapting the script or building without plates.
- **Custom scripting, on by default.** The `eval.run` operation runs custom ExtendScript with your user account's access to After Effects, your files and system commands. Treat a script like any code you run.
- **Turning things off.** Start Claude with `AE_MCP_ENABLE_EVAL=0` to remove custom scripting, or `AE_MCP_READONLY=1` to make the session inspection-only, for example `AE_MCP_READONLY=1 claude`.
- **What reaches Claude.** Your requests, tool inputs and results, project metadata such as item and layer names and settings, and the preview frames you ask for. The plugin does not upload your project or media to JB Technology LLC or anyone else.

## Privacy

The plugin runs on your Mac and has no server of its own. JB Technology LLC receives nothing from it. Read the full [privacy statement](https://github.com/joebenscoter86/after-effects-studio/blob/main/release/website/privacy.md). Anthropic's terms cover how Claude handles your conversation, and any asset or generation tool you use alongside the plugin has its own policy.

## Example prompts

- Check the After Effects version and my current project read-only, and tell me whether the connection works. Don't change anything yet.
- Create a polished motion graphic in After Effects.
- Inspect my AE project and improve its motion.
- Create a motion graphic using my brand colors and visual style.
- Make this explainer in the woodcut style.

## Install

In Claude Code, add the marketplace and install the plugin:

```
claude plugin marketplace add joebenscoter86/after-effects-studio
claude plugin install comp-room@jb-technology
```

Or in one step inside a Claude Code session:

```
/plugin install comp-room --marketplace joebenscoter86/after-effects-studio
```

In the Claude app, open Customize → Plugins → Add marketplace, enter `joebenscoter86/after-effects-studio`, then install Comp Room. Restart Claude, open After Effects, and follow [your first motion scene](docs/first-session.md). [Installation and update](docs/local-install.md) covers updates, and [connection and permission recovery](docs/connection-recovery.md) covers failed connections.

## Remove

```
claude plugin uninstall comp-room@jb-technology
```

Removing the plugin does not touch your After Effects projects, renders or exports.

## Working with existing projects

Claude inspects the open project before it writes and keeps unrelated work, including an unsaved project. Run one After Effects controller at a time. Each tool call is one undo step. A call that throws is rolled back before the error comes back, and the error says whether that worked; a batch is rolled back only when it was run with `stopOnError`. After a script changes the render queue, undo and rollback are refused for the rest of the After Effects session unless the call says it accepts the risk, because After Effects 2027 has crashed on undo after such changes. A request that timed out may still have run: inspect the project before retrying. Saves and exports cannot be undone with project undo.

## What's inside

Six skills (motion-studio, ae-control, motion-review, typography, paper-collage and visual-styles), a reviewer agent (motion-reviewer) that checks a finished piece it did not build and can change nothing, fourteen tools, and a hashed library of 113 documents and code helpers that the `ae_library` tool serves offline. The library includes 31 visual styles, from art deco to woodcut, each with a written grammar, an After Effects recipe and a worked ES3 module; 30 are adapted from Lemo-Opuscar (MIT), and Pixel headline is the plugin's own. The motion language applies to every style; the paper, navy and vermilion JoeB look is an optional preset. [Architecture](docs/ARCHITECTURE.md) describes the package.

## Technique arsenal

The library also holds a catalog of technique recipes filed by the job a beat needs (land a number, add depth, hand over to the next picture). The `ae_arsenal` tool lists the jobs, returns a ranked shortlist for one beat (proven recipes only, unless asked) and reads the chosen recipe.

<!-- arsenal-stills:start -->
Styles and worlds in the library: the visual styles, each a frame of its own proof build. ae_arsenal browse shows them by level.

![House: graphite (style)](library/arsenal/stills/style-house.jpg)
![Example: night glass (style)](library/arsenal/stills/style-example-night-glass.jpg)
![Example: warm paper (style)](library/arsenal/stills/style-example-warm-paper.jpg)
![Art Deco (style)](library/arsenal/stills/style-art-deco.jpg)
![Liminal found footage (world and style)](library/arsenal/stills/style-backrooms.jpg)
![Blueprint (style)](library/arsenal/stills/style-blueprint.jpg)
![CRT terminal (style)](library/arsenal/stills/style-crt-terminal.jpg)
![Dark keynote (style)](library/arsenal/stills/style-dark-keynote.jpg)
![Data storytelling (style)](library/arsenal/stills/style-dataviz.jpg)
![Copperplate engraving (style)](library/arsenal/stills/style-engraving.jpg)
![Game Show (style)](library/arsenal/stills/style-game-show.jpg)
![Glass product (world and style)](library/arsenal/stills/style-glass-product.jpg)
![Halftone dossier (style)](library/arsenal/stills/style-halftone-dossier.jpg)
![Hologram HUD (style)](library/arsenal/stills/style-hologram-hud.jpg)
![Isometric infographic (style)](library/arsenal/stills/style-iso-infographic.jpg)
![Living screencast (style)](library/arsenal/stills/style-living-screencast.jpg)
![Low-poly island (world and style)](library/arsenal/stills/style-lowpoly-island.jpg)
![Microgame frenzy (style)](library/arsenal/stills/style-microgame.jpg)
![Mid-century cartoon (style)](library/arsenal/stills/style-midcentury-toon.jpg)
![One-line drawing (style)](library/arsenal/stills/style-one-line.jpg)
![Paper-cut lightbox (style)](library/arsenal/stills/style-paper-lantern.jpg)
![Pictogram motion (style)](library/arsenal/stills/style-pictogram-motion.jpg)
![Risograph print (style)](library/arsenal/stills/style-risograph.jpg)
![Rubber hose cartoon (style)](library/arsenal/stills/style-rubber-hose.jpg)
![Silent film (style)](library/arsenal/stills/style-silent-film.jpg)
![Silkscreen poster (style)](library/arsenal/stills/style-silkscreen-poster.jpg)
![Spy titles (style)](library/arsenal/stills/style-spy-titles.jpg)
![Stained glass (style)](library/arsenal/stills/style-stained-glass.jpg)
![Swiss motion (style)](library/arsenal/stills/style-swiss-motion.jpg)
![Tilt-shift miniature (world and style)](library/arsenal/stills/style-tilt-shift.jpg)
![Ukiyo-e woodblock print (style)](library/arsenal/stills/style-ukiyoe.jpg)
![Whiteboard explainer (style)](library/arsenal/stills/style-whiteboard.jpg)
![Woodcut print (style)](library/arsenal/stills/style-woodcut.jpg)

Proven techniques in the arsenal, each a still of our own proof build. The ae_arsenal tool returns them with its shortlist.

![Flip an object over](library/arsenal/stills/piece-flip.jpg)
![Hand over from a face card beat to a cutaway room](library/arsenal/stills/piece-hand-over.jpg)
![Show or hide an object with what sits on it](library/arsenal/stills/piece-hide.jpg)
![Flat crisp label](library/arsenal/stills/piece-label.jpg)
![Carry an object onto another](library/arsenal/stills/piece-land-on.jpg)
![Move or grow an object to a new place](library/arsenal/stills/piece-move.jpg)
![Seat a layer on a face of an object](library/arsenal/stills/piece-on-face.jpg)
![A picture or screenshot as the face of an object](library/arsenal/stills/piece-picture-face.jpg)
![Thick lit plate](library/arsenal/stills/piece-plate.jpg)
![Lit room for a full-frame cutaway](library/arsenal/stills/piece-room.jpg)
![Raised rows of content on a card](library/arsenal/stills/piece-rows.jpg)
![Spot light, or a pool of light on the hero](library/arsenal/stills/piece-spot.jpg)
![Lit stage for a face card beat](library/arsenal/stills/piece-stage.jpg)
![Stand an object up](library/arsenal/stills/piece-stand-up.jpg)
![Change what a face says while it is turned away](library/arsenal/stills/piece-swap-face.jpg)
![A tick that draws on](library/arsenal/stills/piece-tick.jpg)
![Tip an object away into the dark](library/arsenal/stills/piece-tip-away.jpg)
![One object with a different colour each side](library/arsenal/stills/piece-two-sided.jpg)
![One hero word or number as a lit object](library/arsenal/stills/piece-type3d.jpg)
![A line that builds word by word](library/arsenal/stills/piece-words.jpg)
![Overshoot bounce on a word's drop-in, with a second word staggered behind it](library/arsenal/stills/01-bounce-keyframes-word-stagger.jpg)
![Concentric gradient discs from a Repeater with eased scale and rotation](library/arsenal/stills/02-repeater-hypnotic-background.jpg)
![Long soft shadow from a blacked-out copy and a radial blur](library/arsenal/stills/03-radial-blur-long-shadow.jpg)
![Hand-traced script word that draws itself and glows](library/arsenal/stills/04-echo-stroke-text-reveal.jpg)
![Frosted glass bar refracting a smeared gradient star (1 variant)](library/arsenal/stills/05-glass-bar-refraction.jpg)
![Window-light shadow map over a flat layout](library/arsenal/stills/01-shadow-map-overlay.jpg)
![Soft diagonal wipe-on for a shadow map](library/arsenal/stills/02-shadow-map-wipe-on.jpg)
![Graphics riding a spinning real object](library/arsenal/stills/03-graphics-orbit-a-real-object.jpg)
![Seat a cut-out object with a soft, doubled drop shadow (1 variant)](library/arsenal/stills/05-soft-doubled-drop-shadow.jpg)
![Tuck graphics behind a person with an automatic object matte](library/arsenal/stills/06-graphics-behind-subject-object-matte.jpg)
![Stacked white discs that grow out of the centre with long soft shadows](library/arsenal/stills/08-raised-white-shapes-with-long-shadows.jpg)
![Soft lens blur at the frame sides plus fine grain](library/arsenal/stills/09-edge-lens-blur-and-noise-finish.jpg)
![Flat UI graphic on a glossy extruded plate](library/arsenal/stills/10-2d-graphics-on-extruded-3d-plate.jpg)
![Depth of field on a row of glossy plates (Advanced 3D camera) (2 variants)](library/arsenal/stills/11-camera-depth-of-field-advanced-3d.jpg)
![Soft one-way blurred dark shapes with a bright stroke fringe on a pale ground](library/arsenal/stills/01-blurred-stroked-shapes-on-light-ground.jpg)
![Wiggled glow, darkest radial blur and fine grain finish for bright scenes](library/arsenal/stills/02-glow-radial-blur-noise-finish-stack.jpg)
![Soft pockets of light from heavily blurred edge shapes](library/arsenal/stills/03-blurred-light-shapes-at-frame-edges.jpg)
![Liquid merge of outlined circles with blur and choke](library/arsenal/stills/04-blur-and-choke-gooey-morph.jpg)
![A dark mass split open behind a travelling ball](library/arsenal/stills/05-path-opening-split-driven-by-moving-ball.jpg)
![Slider-driven minutes:seconds countdown timer](library/arsenal/stills/01-slider-driven-countdown-timer-expression.jpg)
![Edge-only light outline from a solid logo](library/arsenal/stills/01-edge-only-outline-from-logo.jpg)
![Three coloured edge sweeps that spin in and meet at one angle](library/arsenal/stills/02-multi-colour-edge-lines-converging.jpg)
![Four stacked Glow effects blooming a thin outline](library/arsenal/stills/03-stacked-glow-on-outline.jpg)
![Animated light-sweep width: outline brightens, spreads, starts hidden](library/arsenal/stills/04-animated-light-sweep-width-reveal.jpg)
![Solid logo fading in over a glowing outline, with a hot highlight and a small scale-down](library/arsenal/stills/05-fill-reveal-with-composite-and-highlight.jpg)
![Swap the logo or text inside a finished glow-reveal setup](library/arsenal/stills/06-swap-logo-or-text-procedurally.jpg)
![Counter driven by one slider on a control null (1 variant)](library/arsenal/stills/01-value-driven-counter.jpg)
![Ring that fills to the counter's value](library/arsenal/stills/02-ring-fills-to-value.jpg)
![Round-capped bars that grow to their own values](library/arsenal/stills/03-bars-grow-to-values.jpg)
![Icon that fills up to a value](library/arsenal/stills/04-icon-fills-to-value.jpg)
![Map regions that fade up one by one](library/arsenal/stills/05-map-regions-fade-up.jpg)
![Before/after reveal with a sliding rectangle matte and thin edge line](library/arsenal/stills/01-before-after-sliding-matte-wipe.jpg)
![A pill button built in its own comp](library/arsenal/stills/01-pill-button-in-own-comp.jpg)
![A soft coloured lift under a button, and an inset label](library/arsenal/stills/02-button-soft-lift-shadow.jpg)
![Headline, button and web address stacked on a white square](library/arsenal/stills/03-end-card-stack.jpg)
![Tap cursor built from two translucent discs](library/arsenal/stills/04-tap-cursor-with-rings.jpg)
![Card elements slide in from the left, one after another (1 variant)](library/arsenal/stills/05-staggered-slide-in.jpg)
![Cursor glides in and taps the button](library/arsenal/stills/06-cursor-travels-and-taps-button.jpg)
![Curved, eased cursor route in and out](library/arsenal/stills/07-curved-cursor-route.jpg)
![Card elements slide out to the right in the same cascade](library/arsenal/stills/08-staggered-slide-out-exit.jpg)
![Round-capped line that draws on and then wipes off (Trim Paths)](library/arsenal/stills/01-trim-paths-travelling-round-cap-line.jpg)
![Two travelling lines turned into an X by duplicating and rotating](library/arsenal/stills/02-duplicate-rotate-lines-into-cross.jpg)
![Round dots from a shape stroke](library/arsenal/stills/01-dotted-stroke.jpg)
![Arc with a dot at each end](library/arsenal/stills/02-line-with-end-dots.jpg)
![Fade both ends of an open stroke with Taper](library/arsenal/stills/03-tapered-stroke.jpg)
![Text carousel from rotated copies around one pivot (2 variants)](library/arsenal/stills/04-carousel-by-rotation.jpg)
![Tilted 3D ring of discs orbiting a centre (2 variants)](library/arsenal/stills/06-3d-orbit-rings.jpg)
![Slide a background endlessly with mirrored tiling](library/arsenal/stills/09-endless-background-tile.jpg)
![Leaf-shaped particles from any graphic (1 variant)](library/arsenal/stills/10-graphic-as-particles.jpg)
![Soft embossed finish for white shapes on a pale background (1 variant)](library/arsenal/stills/11-white-on-light-finish.jpg)
![Long soft shadow from a radially blurred black copy (1 variant)](library/arsenal/stills/12-long-soft-shadow.jpg)
![Fine dot-grid background from a ball-grid effect](library/arsenal/stills/13-dot-grid-texture.jpg)
![Real cast shadows on an invisible 3D floor (1 variant)](library/arsenal/stills/14-3d-floor-shadows.jpg)
![Keep a chosen layer sharp while the camera travels (1 variant)](library/arsenal/stills/16-lock-focus-to-layer.jpg)
![Tie a 3D scene together with depth fog over the precomp](library/arsenal/stills/17-depth-fog.jpg)
![Soft word-by-word rise-and-fade text reveal (2 variants)](library/arsenal/stills/18-smooth-text-reveal.jpg)
![Text that runs round a drawn path (1 variant)](library/arsenal/stills/19-text-on-a-path.jpg)
![Two stacked glows for a soft cinematic bloom (1 variant)](library/arsenal/stills/20-two-pass-glow.jpg)
![Paper texture through a title matte, with roughened edges](library/arsenal/stills/21-texture-through-a-matte.jpg)
![Frame video in a custom shape with a track matte (1 variant)](library/arsenal/stills/25-custom-media-frame.jpg)
![Card that swings round a pivot below the frame, one step at a time, forever](library/arsenal/stills/02-pivot-null-swing-loop.jpg)
![Card shrinks and leans outward at the ends of its swing](library/arsenal/stills/03-tilt-and-shrink-on-swing.jpg)
![Cards orbiting an ellipse drawn as a mask](library/arsenal/stills/05-mask-path-to-position-loop.jpg)
![Cards growing along a drawn path into a stacked trail](library/arsenal/stills/06-path-trail-scale-rotate-in.jpg)
![Counter-spinning tunnel from stacked card boxes](library/arsenal/stills/08-tunnel-from-stacked-boxes.jpg)
![Wide-lens camera inside the card ring](library/arsenal/stills/11-wide-lens-camera-distortion.jpg)
![Fail, then fix: a red X on the wrong state, a wipe to the fixed one, a tick on the result](library/arsenal/stills/01-red-x-then-wipe-then-tick.jpg)
![Bevelled 3D text wrapped in a tiled material](library/arsenal/stills/01-bevelled-3d-text-material-texture.jpg)
![Shadowless parallel light as an extra backlight](library/arsenal/stills/03-parallel-rim-light-no-shadows.jpg)
![Soft front fill from a point light with smooth falloff](library/arsenal/stills/04-point-light-falloff-front-fill.jpg)
![One mood grade for mismatched art: Tritone plus a single-point Curves, pasted to every layer](library/arsenal/stills/02-tritone-curves-mood-grade.jpg)
![Flat cut-outs into a deep stage: push far layers back in Z, pull near ones forward, rescale to frame](library/arsenal/stills/03-z-depth-push-and-rescale.jpg)
![Endless wind sway from two rotation keys and a ping-pong loop](library/arsenal/stills/05-looping-wind-sway-rotation.jpg)
![Grass rippling in the wind with Wave Warp](library/arsenal/stills/06-wave-warp-grass-wind.jpg)
![Rain slanted to match the wind](library/arsenal/stills/08-rainfall-matched-to-wind.jpg)
![Film-stock grain and mood finish on a top adjustment layer](library/arsenal/stills/10-film-grain-finish-stack.jpg)
![Side-light a face with a matted Curves layer](library/arsenal/stills/13-masked-curves-relight-track-matte.jpg)
![Two-colour phase bar that draws on segment after segment](library/arsenal/stills/01-segmented-progress-bar-draws-in-order.jpg)
![Labels that rise out of their own bar segment](library/arsenal/stills/02-labels-rise-from-behind-the-bar.jpg)
![Step pictures that pop in one after another with a small bounce (3 variants)](library/arsenal/stills/03-step-icons-pop-with-bounce-in-sequence.jpg)
![Small swept-head arrow that draws itself between steps](library/arsenal/stills/04-curved-arrow-draws-between-steps.jpg)
![Stepped jitter and black-and-white photos for a hand-made finish](library/arsenal/stills/05-stop-motion-jitter-and-mono-finish.jpg)
![Faint graph-paper backdrop](library/arsenal/stills/06-faint-graph-paper-backdrop.jpg)
![Bar chart of thick strokes that grow up in a ladder, with value labels sliding in beside them](library/arsenal/stills/07-stroked-bars-grow-in-stagger-with-value-labels.jpg)
![Chart baseline that draws outward from its middle](library/arsenal/stills/08-baseline-draws-out-from-centre.jpg)
![Faint grid held inside the chart's box, and the whole chart stepped to 12 fps](library/arsenal/stills/09-grid-clipped-to-the-chart-area.jpg)
![Pie chart from one fat stroke, with the share pushed out](library/arsenal/stills/10-pie-slice-from-a-stroked-ring.jpg)
![Value label that rises in one word at a time](library/arsenal/stills/11-label-rises-word-by-word.jpg)
![Photo pyramid that dips, then splits into tiers to reveal labels](library/arsenal/stills/12-pyramid-tiers-spread-to-reveal-labels.jpg)
![Cut mid-move to a close-up, carried by a shared upward drift](library/arsenal/stills/13-match-cut-carried-by-movement.jpg)
![Pinned instant photos swaying on a grey map](library/arsenal/stills/14-pinned-photos-swaying-on-a-map.jpg)
![Ink-blend place highlights and a self-drawing border on a grey map](library/arsenal/stills/15-map-highlights-and-border-trace.jpg)
![Glossy red pill button that swings up from below in 3D](library/arsenal/stills/01-gradient-pill-button-3d-entrance.jpg)
![Overshoot-bounce pop-in for an icon, with a letter-by-letter text rise](library/arsenal/stills/02-bounce-expression-pop-in.jpg)
![Glowing blue gradient line that draws on from a button](library/arsenal/stills/03-glowing-gradient-stroke-line-draw.jpg)
![Moving edge highlight and liquid bounce on a glass button (3 variants)](library/arsenal/stills/04-light-sweep-edge-on-buttons.jpg)
![Duplicate, mirror and stagger a button-and-line layout](library/arsenal/stills/05-duplicate-and-stagger-layout.jpg)
![Faint ghost label with reversed gradient overlay, plus a vignette finish layer](library/arsenal/stills/06-subtle-gradient-overlay-and-lens-finish.jpg)
![Four buttons slide together and melt into one large app-window card](library/arsenal/stills/07-shape-morph-into-app-window.jpg)
![Three popping window dots and a faint feathered grid inside a card](library/arsenal/stills/08-bouncing-dots-and-soft-grid-panel.jpg)
![Typed-on note text that deletes and retypes, with word-by-word fade and a hold-key camera push](library/arsenal/stills/09-typewriter-rewrite-text-effect.jpg)
![Glowing liquid orb from blurred wiggling shapes and a sphere](library/arsenal/stills/10-liquid-gradient-orb.jpg)
![Grow an orb out of a small dot through a chain of linked nulls](library/arsenal/stills/11-scale-through-dot-null-link.jpg)
![Hollow glowing ring from a filled orb: inverted-matte cut-out, soft blur, then echo trails](library/arsenal/stills/12-ring-orb-matte-and-echo.jpg)
![Caption that fades in dim, fills to full word by word, sharpens from a blur and keeps growing](library/arsenal/stills/13-text-fill-in-blur-and-scale-finish.jpg)
![Frosted-glass pill built from three stacked shape layers](library/arsenal/stills/01-frosted-glass-pill-from-adjustment-shape.jpg)
![Two-key drop-in that settles with an expression bounce](library/arsenal/stills/03-expression-bounce-drop-in.jpg)
![Offset the logo and text groups a few frames behind the card](library/arsenal/stills/04-staggered-element-offsets.jpg)
![Second notification arrives and the first one is pushed back](library/arsenal/stills/05-stacked-second-notification-with-push-back.jpg)
<!-- arsenal-stills:end -->

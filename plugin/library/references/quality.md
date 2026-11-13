# A render is the evidence

## Model choice and review effort

For visually demanding builds, suggest the most capable model available in your host. A lower-cost model can still build editable drafts; treat its render as a draft until the delivered frames pass visual review. Do not switch models without the user's choice, and never treat model choice as creative acceptance.

## Design and motion review

Inspect full-frame captures at the beginning, build, peak overlap, hold and hand-off. Use contact sheets for temporal continuity and full-resolution stills for type and edges. Check the exported file, not only AE's viewer. Look for:

- A clear visual message with hierarchy and enough reading time.
- No unintended clipping, collisions, blank frames, stale scenes or offscreen essential information.
- Consistent light, shadows, material, palette, edge quality and perspective.
- Motions with a cause and a destination; appropriately weighted easing; clean parenting and anchor behavior.
- Readable type and correct glyphs at phone size; no font fallback or template copy left behind.
- Exact user-supplied numbers, product facts and UI text. Label illustrative data.
- Proper alpha/key edges, no green spill, wrong blend mode or double shadows.
- Seam continuity, source-media completeness and no obsolete asset paths.

## Whole-piece check

A few stills show the moments you chose; a viewer sees every frame. Before handing over a piece, and after any change late in the build, run `ae_check_comp` on the delivered comp. It renders every frame of the work area at quarter size, measures each one and lists what stands out: a one-frame flash or pop, a cut or jump, a repeated frame, a stretch where nothing moves (half a second or more by default), near-black or near-white frames, highlights clipped to 255 with the box they sit in, text that leaves the frame (or a safe area) while visible, missing fonts and footage, and expressions in error. One contact sheet shows the flagged moments.

Read every flag as a fact to judge, not a verdict: a held title is a frozen stretch, a fade to black is a near-black stretch, pure white type sits at 255 by design. Look at the sheet, then render the moments that matter at full size with `ae_render_frame` (`frames: [...]`) before changing anything. A long comp takes more than one call: repeat it with the `next.startFrame` it returns until `next` is null; the structure findings come with the last call. `every: 2` halves the time but can miss a one-frame flash; use it for a first pass, not the final one. A clean result means none of these measures found anything, not that the piece is good: keep the design and motion review above.

Contact sheets cannot prove playback rhythm, sound balance or lip sync. Play the export at speed for those checks. If this interface cannot play audiovisual content, report that limitation separately from inspected frames.

## Technical delivery

Save the intended version and include linked assets. Preserve editable type, shapes, masks and keyframes. Render a review encode and the requested master codec. Verify duration, resolution, frame rate, streams and file size with ffprobe when available. Decode the full video with ffmpeg using `-v error -i <file> -f null -`; an exit-zero decode detects corruption, not visual polish. Compare hashes when copying a verified master to another destination.

Use `scripts/verify-export.mjs <file>` for metadata plus a full decode. It exits nonzero on failure and explicitly requires ffmpeg and ffprobe. Check the requested spec against its report.

**Deliver with a preset and check the file.** `ae_do { operation: "render.deliver", args: { comp, preset, outputPath } }` renders the whole comp through one temporary queue item, brings the written file back and compares it with the comp: size, frame rate, duration within half a frame, and the sound. Presets:

| Preset | Template | Falls back to |
|---|---|---|
| `vertical-reel` | H.264 - Match Render Settings - 15 Mbps | another H.264 template, then High Quality (ProRes 422, a larger file), and says so |
| `master-alpha` | High Quality with Alpha (ProRes 4444) | Lossless with Alpha, then another movie template whose name says alpha; refuses when there is none |
| `master` | High Quality (ProRes 422) | Lossless, then H.264 |

High Quality, High Quality with Alpha and the three H.264 templates are what Adobe documents for a stock install. Lossless and Lossless with Alpha were on the Mac this was built on but are not named stock anywhere found. A template can be deleted, so the result says which one was used and why.

**The sound.** Twice a take's sound read as silence in After Effects and nothing warned. When the comp has sound on, a file with no sound track, or one whose sound reads as silence, is flagged. The level comes from ffmpeg when it is installed (mean and max dB). Without it, the file's sound is read through After Effects' Convert Audio to Keyframes.

Measured live (After Effects 27.0, 2026-11-12, a 2-second 1080 × 1920 comp with a beat track):
- the reel and the alpha master each matched the comp, sound at a mean of −26.5 dB, about 2 s each;
- the same comp with its sound from the four-channel take was flagged silent, at max −84.3 dB through ffmpeg and amplitude 0.002 through After Effects alone (a beat track reads 21.2).

## Handoff

**Lint the project before handing it over.** `ae_do { operation: "project.lint" }` is read only and asks whether another person could open the project and work in it. It finds:
- default layer and comp names;
- footage, solids and precomps at the project's top level (top-level comps nothing uses are deliverables and stay);
- unused footage, solids included;
- missing footage, and missing fonts (After Effects 24+);
- expressions in error, on every property;
- layers switched off with no role (not a track matte, a guide or sound only).

Layers the cut-out path keeps switched off for a re-click are listed under `kept`. Pass `ignore` for anything else kept on purpose. Measured live on a scratch project with one of each problem planted beside a track matte, a sound-only layer and solids in their folder: it named the nine planted problems and nothing else, in 250 ms. On the round-two head-to-head project (82 items) it found 30 unused footage items, mostly solids left by deleted nulls, and 19 items at the top level.

Report what changed, the project and render paths, evidence reviewed, and any missing checks. Keep technical pass, craft judgment and user approval distinct. Record accepted new recipes in the project with exact timings and reference frames. Never claim publication, audience performance or approval from a clean export alone.

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

## Handoff

Report what changed, the project and render paths, evidence reviewed, and any missing checks. Keep technical pass, craft judgment and user approval distinct. Record accepted new recipes in the project with exact timings and reference frames. Never claim publication, audience performance or approval from a clean export alone.

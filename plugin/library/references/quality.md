# A render is the evidence

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

Contact sheets cannot prove playback rhythm, sound balance or lip sync. Play the export at speed for those checks. If this interface cannot play audiovisual content, report that limitation separately from inspected frames.

## Technical delivery

Save the intended version and include linked assets. Preserve editable type, shapes, masks and keyframes. Render a review encode and the requested master codec. Verify duration, resolution, frame rate, streams and file size with ffprobe when available. Decode the full video with ffmpeg using `-v error -i <file> -f null -`; an exit-zero decode detects corruption, not visual polish. Compare hashes when copying a verified master to another destination.

Use `scripts/verify-export.mjs <file>` for metadata plus a full decode. It exits nonzero on failure and explicitly requires ffmpeg and ffprobe. Check the requested spec against its report.

## Handoff

Report what changed, the project and render paths, evidence reviewed, and any missing checks. Keep technical pass, craft judgment and user approval distinct. Record accepted new recipes in the project with exact timings and reference frames. Never claim publication, audience performance or approval from a clean export alone.

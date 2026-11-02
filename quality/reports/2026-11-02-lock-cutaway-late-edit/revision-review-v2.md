# Alignment clarity — V2 first edit

Joe accepted V1 and requested: “Make the five aligned joins clearer.” This revision is ready for Joe's review; acceptance of V2 is not claimed.

## Saved work

- `pin-tumbler-v2.aep`, in this directory. Same comp `PIN_TUMBLER_EXPLAINER_v01`, ID **1**, still 40 editable layers, left open at **12 seconds**.
- V1 retained unchanged. Its SHA-256 remains `a0ac9092f0ac0185dbd27d7bc96624926526ec7fb7b330f0ca967488a70250cd`. Both file hashes and sizes are in `revision-files.json`.
- Same installed RC.2 candidate: `after-effects-studio@aft56-local-test`, version `0.2.1-rc.2+codex.20261102`. Operator-supplied archive SHA-256: `16b8ea9dc200d8c315b03fb3b5546bb4ac85d95a699f128c7986df9ce4ab7b4d`.
- Sole AE controller: evaluator invocation-bound `aft56_candidate`. Reinspection found AE 26.5x89, clean owned V1, four project items and the expected 40-layer comp before editing.

## Exact scope

Only **AFT56_ALIGNMENT_PROOF, layer ID 42**, changed. The lock, control, text and component layers retain their original IDs.

1. Each of the five existing cyan join strokes increased from **4 px to 6 px**, retaining its original path, color and opacity animation.
2. Added one **10 px dark under-stroke** beneath each seam highlight for contrast against brass.
3. Added five **72 × 48 px open elliptical focus outlines**, centered on the existing joins and oriented to the shear line. Each has a **3 px cyan stroke with 7 px dark edging**. The centers remain unfilled, so both pin bodies remain visible.

The added groups inherit the exact original per-join opacity keys. No ring position/scale animation was added. The overlay appears after the physical alignment, using the accepted stagger, and fades with the original layer from frame 420 to its out point at 435. It is absent during the axial turn. The existing continuous shear-line group is unchanged.

## Preservation evidence

Read-only native property snapshots before and after were compared. All **39 non-targeted layers compare identically**, including their exposed shape, transform, expression, keyframe, text, font and timing properties. On the targeted layer, its transform/opacity animation is identical, and each original group differs only by the five intended 4-to-6 px stroke-width changes. Full comparison summary: `revision-property-comparison.json`.

Decoded native PNG comparisons are pixel-identical at frames **36, 153, 299, 300, 435, 472 and 659**. Changed pixels at held target frames are confined to the join-emphasis region, bounded by x=690–1430, y=473–595. See `revision-pixel-comparison.json`. Thus opening, insertion, pre-emphasis state, axial-turn onset/middle and the final hold have direct unchanged-pixel evidence.

The complete copy, resolved ArialMT/Arial-BoldMT faces, font sizes and measured text bounds were read back unchanged. No enabled-expression errors were found. Comp duration remains 22 seconds at 30 fps, 1920 × 1080.

## Actual image inspection

Before and after native captures: frames **36, 153, 299, 300, 306, 312, 324, 360, 419, 428, 434, 435, 472, 659**. Full-size frame 360 was inspected before and after; the after contact sheet was inspected across the whole passage. Files: `revision-before_*.png`, `revision-after_*.png`, and their sheets.

Additional inspected continuity strip: **299, 300, 301, 302, 303, 304, 306, 308, 310, 312, 420, 426, 432, 433, 434, 435, 436**. File: `revision-continuity_sheet.png`.

Visual judgment: the five individual joins are easier to identify and count, the pin bodies remain readable, copy remains clear, and the emphasis disappears before rotation. The fixed outlines do not depict the pins moving into alignment. This is the agent's frame-based judgment, not Joe's acceptance or a full-speed playback claim.

## Failure, intervention and limits

An optional `ae_project_export_json` before-state export was rejected by the host: “MCP tool call requires approval, but approval policy is never.” It created no file and was not retried through another route. Preservation was established using permitted read-only layer inspection and native PNG comparisons instead. No new operator intervention was needed. The actual scoped edit succeeded without a failed or retried native mutation, and no further creative change was applied.

No movie export, full-speed playback or reopened-project check was performed for this clarity adjustment. Final movie/reopen delivery checks remain open pending revision acceptance. V2 is left saved and open for Joe to scrub.

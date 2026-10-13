# AFT-15 causal explainer — native production review

Current disposition (D-012, 2026-10-10): scoped creative ticket complete. The original film, revision, editable delivery, playback and Joe's proof-of-concept acceptance satisfy AFT-15. AFT-9 remains a separate release reliability gate; statements below describe the ticket's earlier dependency state.

Status: approved brief executed on the development Mac. Editable before/after AEPs and complete review movies exist; technical and self-review checks pass for the scoped example. Joe accepted the finished film as a proof-of-concept example on 2026-10-07, while reserving a harder capability test for later. AFT-9's separate recovery gate remains open.

## Scope

Joe approved [the brief](../../fixtures/2026-10-07-causal-explainer-brief.md) on 2026-10-07. Source checkout was uncommitted; the installed `0.1.0+codex.20261007203609` candidate ran through a fresh isolated MCP stdio client because this task's earlier connector binding was stale after reinstall. Host: macOS, AE 26.5x89. I inspected the clean saved AFT-14 project before replacing the open project with a blank one; its original AEP/movie files were already verified and were not overwritten. All AFT-15 layers are owned and prefixed `AFT15_`.

The 8-second, 1920×1080/30 fps piece is an explicitly illustrative blocked-route diagram. A coral signal reaches a closed teal gate, contacts it, the gate rotates into a continuous path, then three queued dots cross and settle inside the destination ring. The camera is static. The original and revised AEPs each contain 18 native layers: six editable text, eleven shape and one real background solid. The reopened final AEP has zero missing fonts.

## Revision and visual corrections

The approved revision moved contact from frame 61 to frame 70 (+0.3s), and retimed the gate, pulse, signal, queued dots, destination state and labels together so the causal order remained intact. The initial blocked-route reading beat begins at the same frame in both versions. Payoff layer ID 33 changed from “Change the cause. Change the outcome.” to “Open the path. Let the system move.”; native readback measured the revised line at 813.1×46.9 px. Source/destination geometry and dot identities were retained.

Full-resolution review found that the initial queued-dot landing stopped just outside the destination, a duplicate hidden coral core sat under the signal at the final registration, and the before/after labels briefly overlapped during their crossfade. I made the same shared correction in both versions: dots 29–31 now enter the ring and settle as a three-dot stack, the duplicate core layer 24 is removed, and the label hand-off has no overlap. Earlier diagnostic files remain in the ignored renders folder; the paired deliverables are the `-arrival` files below. The [final broad contact sheet](../../renders/2026-10-07-causal-explainer/aft15-v2-final-broad_sheet.png), [dense contact sheet](../../renders/2026-10-07-causal-explainer/aft15-v2-contact_sheet.png), [label hand-off](../../renders/2026-10-07-causal-explainer/aft15-v2-label-check_sheet.png), [arrival strip](../../renders/2026-10-07-causal-explainer/aft15-v2-arrival_sheet.png) and [full-resolution final frame](../../renders/2026-10-07-causal-explainer/aft15-v2-arrival-final.png) were inspected. The gate touches the signal without teleport or a second signal; the queued dots follow the opening and fit inside the destination ring without clipping.

## Delivered evidence

| Version | Editable project | Complete review movie |
|---|---|---|
| Before | `quality/renders/2026-10-07-causal-explainer/aft15-causal-explainer-v1-arrival.aep` (SHA-256 `9e76e49b2101d0ff07770abd761f32e8b341040098f7b02d17d9afd78b4118d0`) | `aft15-causal-explainer-v1-arrival.mp4` (SHA-256 `7826ed342f41552dcace8d97e01f508dad807db4031bef880ed57d4b9ee05738`) |
| After | `quality/renders/2026-10-07-causal-explainer/aft15-causal-explainer-v2-arrival.aep` (SHA-256 `39d22446c5238e36ed05a66e3bf2966d591e2d29b2a511da563b73384dde09a4`) | `aft15-causal-explainer-v2-arrival.mp4` (SHA-256 `8f6e12b75471816f60b47c570e67fbb6ed2a6691853c7ed7e1c86e9400afc521`) |

Both final H.264 movies are 1920×1080, 30 fps, 240 frames and exactly 8.000s; bundled metadata/full-decode verification passed. QuickTime played each paired movie from 0 to 8 seconds at speed. The final AEP was reopened clean with one 18-layer comp, no missing fonts and no linked external media. This is a silent, illustrative example; no audio-sync, real-world performance or product-evidence claim is made.

The design is intentionally diagrammatic and clearly distinct from AFT-14's dark typographic identity. After viewing the finished films and discussing their purpose, Joe accepted them as proof-of-concept examples and explicitly required a harder test before the product is finished; that follow-up is AFT-27. This is scoped creative acceptance, not a public-facing hero or upper-limit claim. AFT-9's separate dependency remains open.

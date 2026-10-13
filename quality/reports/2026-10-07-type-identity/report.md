# AFT-14 type-led identity — native production review

Current disposition (D-012, 2026-10-10): scoped creative ticket complete. The original film, revision, editable delivery, playback and Joe's proof-of-concept acceptance satisfy AFT-14. AFT-9 remains a separate release reliability gate; statements below describe the ticket's earlier dependency state.

Status: approved brief executed on the development Mac; editable AEPs and complete review movies exist. Technical and self-review checks pass for the scoped example. Joe accepted the finished movie as a proof-of-concept example on 2026-10-07, while reserving a harder capability test for later. The separate AFT-9 dependency remains open.

## Scope and preservation

Joe approved [the brief](../../fixtures/2026-10-07-type-identity-brief.md) on 2026-10-07. Source checkout was uncommitted; installed candidate `0.1.0+codex.20261007203609` ran through a fresh isolated MCP stdio client because this task's old connector binding was stale after reinstall. Host AE 26.5x89 on macOS. Before native work, AE held the owned AFT-7 sample AEP with one nine-layer comp, dirty. I saved that exact state as ignored `quality/renders/2026-10-07-type-identity/aft7-session-preserved.aep`, verified it clean and intact, then created a new project. The original AFT-7 delivery file was not overwritten (SHA-256 `18f1053a5a78a92819612a3dc55b0f5002fc3851d61056eb015de8bc90c6fba1`).

An initial build failed after creating only an owned comp, background footage and guide layer because an indexed AE shape-property handle was invalidated by adding a sibling. I inspected those three owned project items, removed them by verified IDs, confirmed zero items, reacquired the property by path and rebuilt successfully. No uncertain write was blindly retried.

## Build and revision

The seven-second 1920×1080/30 fps comp uses 17 native layers: 11 editable text layers, five shape layers and one real ground solid. ArialMT/Arial-BoldMT were checked in AE; reopened AEP reports zero missing fonts. The cobalt rule registers `AFTER EFFECTS`, six separate `STUDIO` letters resolve beneath it, and a continuing accent becomes the timeline cursor. The final line has a long reading hold.

The approved revision changed tagline layer ID 46 from “Make motion. Keep control.” to “Create motion. Keep the edit.” and changed only the four accent fills on stable layer IDs 33, 42, 43 and 44 from cobalt `#4C67F5` to teal `#37D7B8`. Native readback recorded the exact old/new Color values and measured the new tagline at 620.5×44.5 px. Wordmark text and timing were retained.

During full-speed review and dense frame sampling, the migrating guide briefly crossed the wordmark at about 2.1 seconds. I applied the same shared corridor correction to both versions: the guide fades during its descent and the accent descends at x=1510, outside the wordmark. The corrected 1.867–2.867s [dense contact sheet](../../renders/2026-10-07-type-identity/aft14-v2-fixed-transition_sheet.png) shows no line/text collision or duplicate title. The revision comparison is therefore copy and accent color on a common corrected motion path. Earlier diagnostic AEPs/movies remain in the ignored renders folder; the paired deliverables are the `-corridor` files below.

## Delivered evidence

| Version | Editable project | Complete review movie |
|---|---|
| Before | `quality/renders/2026-10-07-type-identity/aft14-type-identity-v1-corridor.aep` (SHA-256 `f562bfa0a106aa17066dca93867649eff5841292af9a03b0406f7d6c925d1829`) | `aft14-type-identity-v1-corridor.mp4` (SHA-256 `055d3d30e5d5194dbccd9cc252cdd6e981a34a1d728d0cb9a10c63dc012a6c98`) |
| After | `quality/renders/2026-10-07-type-identity/aft14-type-identity-v2-corridor.aep` (SHA-256 `c1f95ada04bce256e3d6f5464af524389743eecc2f602cc2d27058dd9d50af5f`) | `aft14-type-identity-v2-corridor.mp4` (SHA-256 `94555aea77b5b90626cd1be51e1d9daa73070add9aaff9d9c92f71daa7b20154`) |

Both final movies are H.264, 1920×1080, 30 fps, 210 frames and exactly 7.000s; bundled export verification and full ffmpeg decode passed. The final AEP was reopened clean with one 17-layer comp and zero missing fonts. I inspected the [final broad contact sheet](../../renders/2026-10-07-type-identity/aft14-v2-final-broad_sheet.png), full-resolution final frame and the corrected dense transition sheet. QuickTime played the corrected v2 movie from 0 to 7 seconds at speed; its sampled transition and final frame showed no clipping, overlap or stale frame. The film is silent by brief, so no audio-sync claim is made.

The system is intentionally spare. The top duplicate micro-label is a possible creative refinement, but it does not block the technical example. After viewing the finished films and discussing their purpose, Joe accepted them as proof-of-concept examples and explicitly required a harder test before the product is finished; that follow-up is AFT-27. This is scoped creative acceptance, not an upper-limit or launch-quality claim. AFT-9's naturally occurring possible-write timeout gate remains separately unresolved; this example does not close it or establish release readiness.

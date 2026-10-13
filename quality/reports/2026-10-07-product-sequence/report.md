# AFT-16 — ARC 01 native product sequence

Current disposition (D-012, 2026-10-10): scoped creative ticket complete. The corrected v3 film, editable delivery, inspected guide handoff, playback and Joe's acceptance satisfy AFT-16. AFT-9 remains a separate release reliability gate; statements below describe the ticket's earlier dependency state.

Status: the scoped production and self-review are complete on the development Mac. V3 corrects the guide-to-arm registration that Joe identified after viewing v2. Joe accepted the corrected result on 2026-10-07 (“yea that looks perfect”); AFT-9's separate recovery dependency remains open. This is a fictional desk-lamp concept and a proof-of-concept film, not a marketed product or a test of the plugin's upper creative limit.

## Scope and provenance

Joe approved the [ARC 01 brief](../../fixtures/2026-10-07-product-sequence-brief.md) with “proceed” on 2026-10-07. The sole external image was generated from a text-only prompt in Higgsfield, then visually inspected and fixed as the source. Its job, terms review and limitations are in [asset preparation](asset-prep.md). The original 1344×752 PNG has SHA-256 `a0db04677154106026f27309c5c5093ed0e259b328e1a83bd396870a462173de`; no other product image, logo, human likeness or private Content asset was used. The AEPs link to this PNG at an absolute local path, so move or package the image with the projects when transferring them.

The AE host was After Effects 26.5x89 on this Mac. The controller was installed plugin candidate `0.1.0+codex.20261007203609` (local archive SHA-256 `3833850abab3bd8e6baa6073cf6ff6f43c46af87196b5791c6f4adae476300dd`), driven through a fresh local MCP client because this task's earlier tool binding was stale after the cache refresh. Source checkout base was `e8b58fd58955866a1da7f31d11c9407947a5fc57` with uncommitted work; this is local validation, not a reproducible public release claim.

## Project protection and native construction

Before writing, the exact open project was the saved AFT-15 final v2, with three project items. A clean session copy was saved as `aft15-session-preserved-before-aft16.aep` in the AFT-16 renders folder; the existing AFT-15 deliverable retained SHA-256 `39d22446c5238e36ed05a66e3bf2966d591e2d29b2a511da563b73384dde09a4`. Only after inspecting and preserving it did the controller open a new empty project. No unrelated layers were edited or removed.

The owned comp is 1920×1080, 30 fps, eight seconds, 16 bpc, with nine native AE layers: a ground solid, linked PNG with animated mask/opacity/scale, trimmed shape guide, light response, underline, and four editable text layers. The guide follows the lamp's depicted arm; a feathered upward mask reveals the fixed artwork. The source remains a flat linked image, not a fabricated 3D product model. The build and revision scripts are retained beside the ignored renders for reproduction.

The first visual strip exposed a double edge in the guide/photo overlap. A targeted guide-position and opacity-timing correction was applied before the v1 AEP and complete movie were saved. The later requested revision changed only text layer ID 22 from `LIGHT, SHAPED` to `FORM MEETS LIGHT` and the light/underline accents on layer IDs 19 and 23 from RGB 213/162/93 to 232/185/123. The linked footage kept item ID 1 and the same path; comp ID 2, nine layers, guide geometry, image timing, concept name and description remained intact. The new line's measured bounds fit in the left reading area.

After viewing v2, Joe noticed that the guide's middle curve did not line up with the lamp arm. This was a real registration error, not an intentional offset: the guide endpoints were close, but its Bezier path bowed too far right. For v3, the dark-blue arm centerline was measured at multiple rows of the fixed PNG and mapped through the image's AE scale and position. Only the owned guide layer ID 18's path changed; comp ID 2, the source footage/layer IDs 1/17, all nine layers, timing, text and color remained in place. The rendered 0.9–2.0-second [alignment sheet](../../renders/2026-10-07-product-sequence/aft16-v3-alignment_sheet.png) shows the guide tracking the visible arm through the handoff. V1/v2 remain as before/after evidence; v3 is the corrected review candidate.

## Files and checks

| File in `quality/renders/2026-10-07-product-sequence/` | SHA-256 | Result |
|---|---|---|
| `aft16-arc01-product-v1.aep` | `3fcfba61c6f0482a89c96062c0ae8845b97d37211770725eb8538c1273f0f0e1` | Reopened clean: four project items, comp ID 2/nine layers, original line and linked source present. |
| `aft16-arc01-product-v1.mp4` | `b122db191efa56ad886c36dc778fe85a31135dec31aca2ee47386a1a129b595d` | Native AE H.264 render; metadata and full decode passed. |
| `aft16-arc01-product-v2.aep` | `e1e446bd87fe0e551ffe2905a525e4eaef68d4440b3cb28b04a7de062b794261` | Reopened clean: four items, nine layers, revised line and linked source present; completed owned render-queue item is stored in this AEP. |
| `aft16-arc01-product-v2.mp4` | `6316a7670407a6b88836daadb7e501347d08cdc3359b5f95cf4235053a90a561` | Native AE H.264 render; metadata and full decode passed. |
| `aft16-arc01-product-v3.aep` | `e54ae5da4c2a0a50bd00e117de413645deb65bc353ddb21d10085ec3902e1c79` | Corrected guide; reopened clean with four items, nine layers, linked source and no render-queue items. |
| `aft16-arc01-product-v3.mp4` | `603ccdf6f39188f16986e6cab11e8f5081f1e4b1e366f4ab254b79a156732322` | Native AE H.264 render; metadata and full decode passed. |

All three movies are 1920×1080, 30 fps, 240 frames, 8.000 seconds, H.264/BT.709, with no audio as briefed. `plugin/scripts/verify-export.mjs` reported `fullDecodePassed: true` for each. All three AEPs were reopened in AE after rendering; the fixed source path existed in each and `font.list_missing` returned zero on v2 and v3. The final v3 AEP is left open in AE, clean. File hashes above were recalculated after these checks; AE persisted the completed owned render-queue item in v2, which explains its final AEP hash.

## Visual judgment

The [v2 broad contact sheet](../../renders/2026-10-07-product-sequence/aft16-v2-broad-sheet.png) covers 0, 0.5, 1.2, 1.6, 2, 2.8, 4, 5.3 and 7 seconds. The [v3 alignment sheet](../../renders/2026-10-07-product-sequence/aft16-v3-alignment_sheet.png) densely covers the corrected 0.9–2-second handoff. The [full-resolution final frame](../../renders/2026-10-07-product-sequence/aft16-v2-final-frame.png) was inspected for text collision, clipping, source-image softness and light continuity; v3 changes only the guide, which is invisible in the final hold. The final frame is readable and the object is complete; the source's 1344×752 resolution sets the detail ceiling at 1920×1080 output. The v2 and v3 movies were opened in QuickTime; v3 played from the start to the eight-second endpoint.

The guide now matches the lamp arm through the difficult passage. The lamp is still briefly translucent around 1.4–1.6 seconds while the line gives way to the photograph; it resolves by about 1.8 seconds without a persistent double outline. The first second is deliberately sparse. These are creative judgments for Joe to accept or revise, not runtime failures. No subjective audio judgment applies to this silent brief.

## Gate

Native construction, targeted revision, registration correction, AEP reopen, linked-media check, font check, movie metadata, full decode and self-review passed for this Mac. Joe accepted the corrected v3 film after reviewing the aligned handoff. AFT-16 remains In Progress only because its AFT-9 recovery dependency is unresolved; AFT-17 can use this accepted proof-of-concept for a provisional three-style comparison, and AFT-27 is the later hard capability probe before release review.

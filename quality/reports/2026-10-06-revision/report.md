# AFT-11 targeted revision — 2026-10-06

Status: native revision mechanics and sampled visual inspection passed in an owned technical scene. Keep AFT-11 In Progress until its AFT-7 fresh installed-task dependency and a full-speed pacing review are complete. Source: Git HEAD `e8b58fd58955866a1da7f31d11c9407947a5fc57` plus uncommitted changes. Local candidate `0.1.0+codex.20261007055008`, archive SHA-256 `86a2c8c62330a33c78ae2702c44490dae0caef91d10f09c8fc26180eaa55df0f`. Host: macOS 26.6.2, Node 25.9.0, AE 26.5x89. Native calls used the current source bundle, not a fresh task loading the installed cache.

The starting project was untitled, unsaved and empty. One controller created only comp ID 13 (`AFT11_REVISION_OWNED`) from the bundled native demo and added a real background layer so the review PNGs have a rendered ground. The editable scene had 45 native layers, 960×540, 30 fps and five seconds duration. Its [before AEP](../../renders/2026-10-06-revision/before.aep) is 657,971 bytes, SHA-256 `c477962a608f053e3cbe02a26568a3f0ab358c1b04de0b71986580d6bc76251a`. [Before contact sheet](../../renders/2026-10-06-revision/before_sheet.png) samples 0.4, 1.0, 1.6, 2.4, 3.3 and 4.5 seconds.

Four separate guarded edits targeted stable IDs in the same comp:

| Request | Native change | Readback |
|---|---|---|
| Copy | Title ID 49 to “From idea to proof.”; subtitle ID 50 to “Design it. Animate it. Verify it.” | Text matched; comp stayed ID 13 with 45 layers |
| Palette | Eyebrow ID 48, bars 54/61/66, block 62 and OK label 67 changed from mint accent to warm `[1, 0.66, 0.27]` | All six existing accent layers reported, no new layer |
| Pacing | Title ID 49 position entrance end moved 0.6→0.9 s; opacity entrance end ~0.32→0.6 s | Both properties retained two keys; the 0.4 s after frame shows the title still entering |
| Framing | Eyebrow 48, title 49 and subtitle 50 shifted 30 px right | Readback X positions 90/90/92; cards and footer did not move |

The final copy request was sent twice more through `text.set_content` against layer ID 49. Both calls returned the same text; fresh project and comp readback still showed one comp ID 13 with 45 layers. Comparing complete `ae_layer_info` summaries before/after found exactly the eight intended changed layer IDs (48, 49, 50, 54, 61, 62, 66, 67); all 37 other layer summaries were identical. Comp identity, size, duration and all non-layer fields were identical. These checks establish targeted native structure, not creative approval.

The [after contact sheet](../../renders/2026-10-06-revision/after_sheet.png) used the same six times. I also inspected the full-size [1.6 s frame](../../renders/2026-10-06-revision/after_2.png): revised type fits, the warm bars and block render cleanly, the three cards keep their original arrangement, and the background covers the frame. The later hold samples stay readable. The before/after frames prove visible changes and no obvious clipping at sampled times. No complete movie was exported or played at speed, so motion rhythm and seam quality are not certified here; no user acceptance was requested for this internal sample.

The [after AEP](../../renders/2026-10-06-revision/after.aep) is 659,685 bytes, SHA-256 `555d0287179d515d6ff3000107f76187bc8b35fbf9987f1a29a644bfe86d2df4`; the before AEP remained unchanged. Only the saved owned scene was closed. Final `ae_context`: clean untitled project, zero items. Raw native responses and inspections are under Git-ignored `quality/reports/raw/2026-10-06-revision/`; AEPs and frames are under ignored `quality/renders/2026-10-06-revision/`.

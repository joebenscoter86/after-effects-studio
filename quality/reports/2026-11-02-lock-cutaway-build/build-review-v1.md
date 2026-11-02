# Pin tumbler cutaway — first complete build

Status: ready for Joe's native AE review. Story approval preceded construction; approval of the finished film remains open. No meaningful late edit has been applied.

## Review surface

- Project: `pin-tumbler-v1.aep` in this directory. The target did not exist before Save As.
- Main comp: `PIN_TUMBLER_EXPLAINER_v01`, item ID **1**. Left open at **11 seconds**, the alignment hold.
- Format: 1920 × 1080, square pixels, 30 fps, 22 seconds, 16 bpc, project working space None.
- 40 editable layers. Complete stable IDs are recorded in `native-audit.json`.
- Controller ID 17; key ID 23; bottom pins IDs 24–28; top pins IDs 29–33; springs IDs 34–38; rotating lower shell ID 39; stationary front housing ID 40; alignment overlay ID 42; captions IDs 43–47; labels IDs 48–51.
- Controls: key insertion, axial turn in degrees, five contact-driven pin tips. The shape expressions are native and saved inside the AEP. Generated JSX files are construction records, not runtime dependencies.

## Candidate and model

Sole AE controller: invocation-bound stdio MCP `aft56_candidate`, using the installed `after-effects-studio@aft56-local-test` **0.2.1-rc.2+codex.20261102** candidate at `/Users/joeb/.codex/plugins/cache/aft56-local-test/after-effects-studio/0.2.1-rc.2+codex.20261102`.

Operator-supplied ZIP SHA-256: `16b8ea9dc200d8c315b03fb3b5546bb4ac85d95a699f128c7986df9ce4ab7b4d`. The operator stated that all 67 installed cache files were verified. This run did not repeat that hash audit.

The explicit MCP binding and invocation-scoped approval settings are evaluator setup, not ordinary end-user installation steps. The prior attempt was blocked at the host approval gate for read-only font.list without a native write. The operator supplied supported invocation-scoped approval for this continuation. No alternative controller was used.

Host reinspected before writing: AE **26.5x89**, push transport, file null, dirty false, numItems 0, 16 bpc.

Model identity available in this session: **Codex / GPT-6**. Exact runtime model variant is not exposed; no more specific model name is asserted.

## Built

Original projected vector cutaway with one persistent key, plug, five pin pairs and springs, fixed housing, restrained cyan alignment ticks, five editable caption beats, four introductory part labels and timeline markers. Dark/brass/cyan art direction and the approved frame schedule are retained. Beat 4 reads exactly: **With the joins aligned, the plug can turn.**

The illustration is simplified original geometry. The manufacturer's PDF was used only for page-one mechanical facts during planning; no manufacturer artwork, branding or exact product dimensions are used. No external media dependency exists.

Insertion occupies frames 90–270. The first pin contacts the tip at frame 108 and visibly lifts at 109. The five join centers align at 270, well before the 435–510 axial turn. The final copy settles at frame 552 and holds to frame 659. All time spans use inclusive starts and exclusive ends.

The projection maps a three-dimensional axial rotation to editable two-dimensional native shape paths. It is not a screen-plane rotation. It is an illustrative vector construction, not a solid CAD mesh or physically simulated lock. The key enters through the left image edge; its bow comes fully into view as insertion proceeds.

## Proof and corrections

Geometry was rendered and visually inspected before the completed typography pass. Evidence: `proof_sheet.png`, full-size proof frames, and `proof-corrected_sheet.png`.

Corrections during the first build:

1. Reversed native shape-group stacking so the key aperture, groove, edge details and pin cap/join surfaces remain visible.
2. Connected the small gap between the key bow and blade with a native neck surface.
3. Increased the lower-pin taper clearance to accommodate the steepest illustrative key bevel while maintaining point contact.
4. Added turning lower-bore recesses and completed the planned staged alignment overlay.

These were construction/self-review corrections within the approved story. No hypothetical follow-up creative revision was made.

## Inspected and measured

- `film-review_sheet.png`: 23 native frames across the opening, caption changes, insertion, alignment, rotation and final hold. Full-size opening, alignment and final frames were also inspected.
- `contact-strip_sheet.png`: consecutive frames around the first lift of every pin: 107–109, 128–130, 155–157, 191–193 and 235–237.
- `turn-strip_sheet.png`: 22 native frames around insertion resolution, overlay onset, turn onset/middle/settling. Includes frames 268–272, 299–301, 323–325, 433–437, 450, 472, 495 and 509–511.
- Native path audit: 530 contact samples during insertion, maximum projected contact error **0.0000688 px**, no contact failures. This is geometric registration evidence, not a claim of perceptual perfection.
- All five lower/upper join centers coincide at frame 270, with zero measured separation and the same world shear height.
- Upper pin top-face movement between turn start and completion: **0 px**. Housing and upper assembly also remain visually fixed in the inspected turn frames.
- Bottom-pin join centers match the 30-degree axial projection with maximum error **0.0000499 px**.
- No enabled-expression errors found.
- Actual text Source Text, resolved font faces, glyph coverage and measured bounds checked. Captions use Arial-BoldMT at 52 px; labels use ArialMT at 30 px. Exact strings and fit are recorded in `text-manifest.json` and `native-audit.json`.
- The initial combined glyph probe included newline control characters and reported false; repeat tests of the actual printable caption and label characters passed. Actual multiline text was inspected in the native captures.
- Native captures report working space None and an unchanged-values 16-bit-to-8-bit sRGB-tagged capture pipeline.

## Open review items

No movie was exported. Full-speed playback, playback rhythm and movie encoding/decoding checks remain open for Joe's AE review. Frame strips establish sampled continuity, not full-speed perceptual acceptance. The approved silent version contains no audio; no audio review is claimed. Joe's creative acceptance of this first complete build remains open.

The main comp is the primary review surface. Start at 3 seconds for insertion, 10 seconds for alignment, and 14.5 seconds for the axial turn.

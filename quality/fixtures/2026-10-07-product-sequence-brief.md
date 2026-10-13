# AFT-16 brief — ARC 01 concept product

Status: Joe approved this direction with “proceed” on 2026-10-07. The native before/after scenes and movies are now built; Joe's acceptance of the finished film remains separate. ARC 01 is a fictional desk-lamp concept, not a purchasable product or a claim about an existing brand.

## Project

- Viewer takeaway: the plugin can turn a fixed, externally prepared product image into an editable, visually coherent AE product film, then revise the scene without losing the approved design. The lamp film itself is an illustration, not a product advertisement.
- Format: 8 seconds, 1920×1080, 30 fps, silent 16:9. Native AE text, shapes, masks and keyframes over one linked raster artwork. Review at full size and phone width.
- Look: warm ivory studio ground, midnight-blue metal, restrained amber light. The lamp design and light direction come from the source image. Use installed, ordinary fonts verified on the host; no JoeB preset, private Content assets or paid template.
- Exact text: `ARC / 01` as a concept name, `LIGHT, SHAPED` as the visual line, and `A study in form and focus.` as a closing description. No brightness, battery, price, performance or availability claim.
- Ownership: create an `AFT16_` comp and owned layers only after inspecting the exact open AE project. Do not replace the clean final AFT-15 project or other user work. Save heavy AEP/media/export files in `quality/renders/2026-10-07-product-sequence/`.
- Delivery: before/after editable AEPs, linked source image, complete H.264 review movies, contact sheets, full-size stills and a dated evidence report. The final copy of the source artwork must hash-match the fixed input.

## Fixed artwork and provenance

The candidate input is `quality/renders/2026-10-07-product-sequence/arc-01-key-art-v1.png`, 1344×752 PNG, SHA-256 `a0db04677154106026f27309c5c5093ed0e259b328e1a83bd396870a462173de`. It was generated on 2026-10-07 through the connected Higgsfield `gpt_image_2_5` model, job `3abf3972-127f-47fc-9bd6-f1d470268ad5`, from a text-only prompt written for this fictional lamp; no third-party reference image, logo, person or packaging was supplied. The original job result is retained in Higgsfield and the downloaded PNG is the fixed local input. The image was visually inspected: one consistent product, unclipped silhouette, ample left reading space, no visible text or watermark. It includes a baked studio shadow and warm light pool, so AE must not add a conflicting second shadow or pretend the lamp is an independent 3D model.

Higgsfield's Terms of Use section 4.4 says it does not claim ownership of outputs and does not restrict commercial use, while section 4.4 also says outputs may not be unique or exclusive. Verify the current terms again before public distribution: https://higgsfield.ai/terms-of-use-agreement . Do not call this concept a real commercial product or imply that AI-generated art is independently copyrightable/exclusive. The generated PNG is an external linked source asset; it is not bundled into the plugin package.

## Visual operation and poses

The star is the same pictured lamp throughout. A native guide traces its physical curve, then directs attention to the lamp head; a controlled light reveal exposes the product and becomes a baseline for the concept name. The image remains spatially stable, with a single slow reframing move rather than a simulated product rotation that the flat asset cannot support.

| Frames | Viewer sees | Purpose and risk |
|---|---|---|
| 0–24 | Warm ivory ground and a thin midnight-blue line draw from the lower-right base position up toward the lamp head. The product image is initially veiled, with the light pool only faintly visible. | Establish the curve as the visual operation; the first frame has a real ground layer. Guide must register against the actual image geometry. |
| 20–58 | A masked reveal exposes the lamp from base to head while the guide resolves into the visible arm. A restrained amber light response blooms at the head and on the already-baked light pool. | Hard passage: line-to-photo handoff without double edges, false depth or a second shadow. Inspect the mid-overlap densely. |
| 54–106 | The image makes one gentle, continuous push; `ARC / 01` and `LIGHT, SHAPED` build in the left negative space. | Ordinary reading beat. Product silhouette and title stay clear; type does not ride the image edge. |
| 100–160 | The traced line extends left into a short native underline; the small closing description appears after the motion settles. | A consequential handoff from product geometry to type, not another generic card entrance. |
| 155–240 | Complete hero image and copy hold. The glow returns to a restrained level; no new motion distracts from reading. | Final frame must resolve the whole object, copy and light pool without clipping or competing highlights. |

The hardest check is frames 20–58, especially the guide/image registration, matte edge and lamp-head light. Check frames 0, 20, 36, 58, 84, 118, 160 and 210, plus a dense strip around the hard passage and full-speed playback. Review the actual rendered movie, not AE's cached viewer alone.

## Revision and review contract

After the first complete render, revise the line `LIGHT, SHAPED` to `FORM MEETS LIGHT` and shift the amber light accent toward a warmer soft gold, keeping the product PNG, guide geometry, image timing, concept name and unrelated project material unchanged. Record stable layer IDs and before/after property checks. If the second copy does not fit, adjust only its layout and report that targeted change.

The source art is 1344×752 while the comp is 1920×1080; its required scale is about 1.44×. Check image softness at native output and do not claim photographic detail beyond the source. Also check matte edges, light continuity, native text bounds, linked-media resolution, AEP reopen, movie metadata/full decode and complete silent playback. Technical pass, self-review and Joe's approval are separate.

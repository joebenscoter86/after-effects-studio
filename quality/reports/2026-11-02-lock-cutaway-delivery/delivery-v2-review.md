# Accepted V2 — editable and playback delivery checks

The first film and V2 alignment edit were creatively accepted by Joe before this delivery pass. No creative changes were made.

**Preservation failure:** the playback checks completed, but the accepted V2 AEP's bytes changed during the native reopen/render-queue cleanup sequence despite `project.open(save:false)` and no `ae_save_project` call. The exact cause is unresolved. V1 is unchanged. No exact accepted-V2 backup was found in the owned output directory; no reconstruction or outside-directory recovery was attempted.

## Deliverables

- Current editable project: `pin-tumbler-v2.aep`, now SHA-256 `6745dc3aadcfe8d09ac9f66338fab7b5654ca18b7c5676624e6d3fa78dec5ed1`, 1,377,929 bytes. Expected accepted SHA-256 was `db94c42e9b70c428dec4483e3e134f358e49eeeb7a00529e300c7de23c7e9511`, 1,377,025 bytes.
- Playback copy: `delivery-v2-playback.mp4`, 1,281,154 bytes, SHA-256 `28c28ce5b895464c41fae28497044ea3db062840420842bba31b8c63d5c9148a`.
- Native intermediate: `delivery-v2-intermediate.mov`, 258,695,780 bytes, SHA-256 `708600c22d50b598de6166122bbdfc9bf2f2683947cf7a902f69460ec9cf888e`.

All paths are in this owned output directory. V1 retains SHA-256 `a0ac9092f0ac0185dbd27d7bc96624926526ec7fb7b330f0ca967488a70250cd`. V2 still matched its accepted checksum when the intermediate and MP4 were verified, but failed the later post-cleanup hash check. Media-evidence hashes therefore describe that earlier verification stage; the native evidence records the later file hashes.

## Native project verification

Before opening: AE 26.5x89, owned V2 clean, expected saved hash, comp ID 1, 40 layers. Opened V2 using the dedicated candidate `project.open` operation, outside eval/batches, without saving transient state.

Comp `PIN_TUMBLER_EXPLAINER_v01`, ID **1**, remains 1920 × 1080, 30 fps, 22 seconds, 16 bpc. Readback after opening found:

- 29 native shape layers, 186 shape paths, nine native text layers, one control null and the background solid.
- 161 property keyframes and 144 enabled expressions, with no expression errors.
- All 40 original layer IDs retained and unlocked. Controller ID 17, key ID 23, bottom pins 24–28, top pins 29–33, alignment emphasis 42, captions 43–47.
- Seven native slider controls: keyed key insertion and axial angle, plus five expression-driven pin tips.
- ArialMT and Arial-BoldMT resolve without font substitution. Full copy remains native Source Text.
- No external footage dependencies. The only footage sources are the embedded background and null solids; neither is missing. Fonts remain system dependencies and are not bundled.

`delivery-v2-native-evidence.json` records native details, render settings/results and cleanup. Editability was inspected through native properties; no destructive test edits were made to accepted artwork.

## Render and encode

Created one transient owned render-queue item for comp 1. Native settings: **Best Settings**, Full resolution, comp frame rate 30, frames 0–659, 0–22 seconds, no resize/crop/proxy, post-render action None. Available **High Quality** output template produced QuickTime **Apple ProRes 422 Standard**, 10-bit YUV422, progressive, BT.709 tagged. Native render completed successfully; AE reported DONE and verified the newly written file. Elapsed render time reported by queue: 144 seconds.

Encoded with the existing `/opt/homebrew/bin/ffmpeg`: libx264 High profile, CRF 17, medium preset, YUV420p limited range, BT.709 tags and faststart. No audio added. `/opt/homebrew/bin/ffprobe` confirms **1920 × 1080, 30/1 fps, 660 decoded frames, 22.000 seconds**. Both intermediate and MP4 completed full video decode with exit code 0. MP4 probe/decode logs are empty. Exact commands, metadata, hashes and numeric comparisons are in `delivery-v2-media-evidence.json`.

## Actual frame comparison

Captured native frames after opening V2 and decoded matching movie frames at **36, 153, 270, 360, 472 and 659**: opening, insertion, aligned key, emphasized joins, axial-turn middle and final hold.

Inspected `delivery-v2-comparison.png` (native versus decoded MP4) and the full-size decoded alignment frame. Copy, geometry, component positions, emphasis, occlusion and framing match at these samples. No missing frames or temporal offsets were observed in this sampled comparison.

These are lossy video outputs, not pixel-identical PNGs. Across the six frames, native-versus-ProRes mean absolute channel errors are approximately **0.84–1.19/255**; native-versus-MP4 errors are approximately **1.94–3.13/255**. Maximum edge/channel errors reach 65/255 around sharp boundaries. Example flat background RGB: native PNG **16,22,28**, decoded ProRes **15,21,27**, decoded MP4 **13,20,25**. Fine cyan edges show expected chroma subsampling differences.

Color limit: project working space is None. Native captures use unchanged-values conversion from 16-bit to 8-bit sRGB-tagged PNG; the playback is BT.709-tagged limited-range video. Numeric comparisons use decoded RGB values. QuickTime's color-managed display appearance and full-speed perceptual review remain for the parent. No assertion of exact display-color equivalence is made.

After final cleanup/reopen, the 12-second native capture `delivery-v2-reopened.png` is pixel-identical to the earlier native 12-second capture.

## Failures, warnings and cleanup

- Native render completed without a reported render error or uncertain retry.
- The intermediate MOV emits **“Referenced QT chapter track not found”** during ffprobe/ffmpeg reads. It contains a timecode data track; the exact warning cause was not investigated. All video frames decode successfully. The MP4 omits auxiliary tracks and probes/decodes without this warning. Original logs and intermediate are retained.
- Same-file `project.open` reported clean V2 but retained the completed owned render-queue item. This was inspected with `render.status`; only that known item was removed. Reopened V2 again with save false. Final queue count is zero, project is clean and comp ID 1 remains open at **12 seconds**. A subsequent filesystem check found that V2 had changed despite no explicit save call. Its modification time was 2026-11-02 12:54:12 local. V1 remains byte-identical.
- The owned `Auto-Save/pin-tumbler-v2 auto-save 1.aep` was inspected by hash only; it is not the accepted file (SHA-256 `fffff1af4c8cbb8e1381026ff809e902ddb4d562a53afe92a69b3542ab7981b1`). It was preserved and not opened or used as a replacement.
- A retrospective full-property comparison against the prior turn's in-memory V2 snapshot could not run because that snapshot was unavailable in this delivery turn. No equality claim is made from that attempted comparison. Current native IDs/counts/control structure and the pixel-identical 12-second frame provide partial preservation evidence, not byte identity or a complete before/after property proof.
- No denials occurred during this delivery pass. The earlier revision's optional JSON-export denial remains recorded in `revision-review-v2.md`; it was not retried.

## Candidate and unperformed checks

Sole AE controller: evaluator invocation-bound `aft56_candidate`, installed **after-effects-studio@aft56-local-test 0.2.1-rc.2+codex.20261102**. Operator-reverified archive SHA-256: `16b8ea9dc200d8c315b03fb3b5546bb4ac85d95a699f128c7986df9ce4ab7b4d`. The explicit binding is evaluator setup, not an ordinary user's installation step.

No human/full-speed QuickTime playback review, player compatibility acceptance, audio review, separate-machine reopen or AE restart test is claimed. The approved silent movie has no audio stream. Parent will perform visible QuickTime playback inspection. Publication and release operations were not performed.

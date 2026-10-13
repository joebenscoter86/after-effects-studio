# AFT17 causal study — portable execution brief

Prepared in a fresh Codex chat on 2026-10-10 (America/Los_Angeles). Not yet built: native execution stopped at the preservation gate documented in report.md.

## Intended picture

An eight-second silent 1920×1080, 30 fps diagram shows an illustrative temperature crossing a threshold, carrying a signal to a vent, and opening that vent. The gauge is the stable anchor. Native shape paths, editable text and controls own the entire diagram. No footage, personal rig, product art or sensor data is used. A pale blue-gray actual background layer supports graphite structure and one restrained amber signal. The camera stays static so spatial registration and causal order remain directly readable.

The opening title is “TEMPERATURE CONTROL”. A persistent small footer reads “FICTIONAL SYSTEM · ILLUSTRATIVE VALUES”. Gauge values are unitless illustrative 20, 26 and 28; do not imply measured Celsius or real control performance. The fixed 26 threshold is visually distinct from the moving indicator. The vent state reads “VENT CLOSED” before contact and “VENT OPEN” only after its native slats finish opening. One state text layer changes its source text; do not overlap two labels.

## Geometry and poses

- Gauge stays around x=470, from y=730 (20) to y=330 (28), with 26 at y=430. Numeric value appears beside its moving indicator. A fixed scale preserves numeric meaning.
- Threshold contact is the junction at [540,430]. A thin graphite route runs from there to [1080,430], then [1080,540], then the vent input at [1280,540]. One amber signal follows this connected path; no position jump at the corners.
- Vent occupies x=1290…1620 and y=395…685. Native individual slats begin closed and rotate/compress within the frame to reveal the opening. The signal lands at the vent input before any slat moves.
- Start: guide and structures construct in place, indicator holds 20, vent closed. Action: value rises to 26, threshold responds, signal traverses the route. Payoff: signal contacts vent, slats open, label changes, value reaches 28, whole result holds through frame 239.

## Planned timing and revision

All frames are zero-based at 30 fps. Times are design targets, not executed evidence.

| Event | v1 frame | v2 frame |
|---|---:|---:|
| Guide/structure construction | 0–24 | 0–24 |
| Initial 20 hold ends | 30 | 30 |
| Indicator reaches 26 / threshold contact | 90 | 99 |
| Signal begins at threshold junction | 90 | 99 |
| Signal arrives at vent input | 126 | 135 |
| First visible vent opening | 127 | 136 |
| Vent fully open; state becomes VENT OPEN | 145 | 154 |
| Indicator reaches final 28 | 150 | 159 |
| Final result hold | 150–239 | 159–239 |

Use one threshold-frame control, with downstream expressions or coordinated keys derived from it. Revision changes only that control from 90 to 99 and adjusts the 20→26 rise to preserve the start. Keep geometry, palette, 20/26/28 and end state unchanged. Preserve comp/layer IDs across revision and save separate before/after AEPs. Signal travel is measured path travel with no overshoot; slat opening uses a short restrained ease. Construction uses outline before material and amber only on the semantic turn. The eight-second explanatory pace intentionally uses fewer events than the packaged fast-construction example.

## Planned checks and handoff

Use unique AFT17_CAUSAL names. Heavy output goes in quality/renders/2026-10-10-portable-causal-fresh/. Evidence and authored scripts go alongside this brief. Create a new project only after the current project's preservation condition is resolved.

Inspect broad frames 0, 15, 30, 60, 90, 108, 126, 136, 150, 210, 239; densely inspect every frame in threshold ±3, each path corner ±2, contact −3…+5, and opening/label completion ±3. Shift corresponding v2 neighborhoods by nine frames. Check numeric indicator registration, source contact, continuous signal motion, closed slats through contact, one label at a time, type fit and background coverage. Render both complete eight-second movies, inspect full-resolution stills and full-speed playback, save/reopen both editable AEPs, inspect expression/font/link status, verify metadata, full decode and hashes. Compare background/layout readbacks before and after. Runtime validity, visual judgment and Joe's approval remain independent.

# Production brief — Six in, two forward

A fictional inbox review diagram, built entirely from editable AE shapes, text and transforms. Format: 1280×720, square pixels, 30 fps, 9 seconds. No audio or external imagery. The viewer must understand that the same six requests become four deferred requests and two approved requests, and only those two travel to a next workspace.

## Visual language

Deep aubergine background (#210E26 approximately), warm ivory document faces (#F7F0DB approximately), electric mint approval (#61FFBA approximately). Muted mauve distinguishes deferred documents. Color is supported by explicit status labels and stable request IDs; the explanation works without relying on color alone. The diagram uses chamfered document corners, thin rules, square selection frames and generous empty space. No house preset, presenter, ornamental particles or unrelated badges.

Arial regular is the provisional broadly available face; native type remains editable. Header 40 px, footer 25 px, supporting copy 21 px, section labels 18 px and document IDs 16 px. The 12 px status labels supplement the larger counts and section labels; they are not the sole explanation. Maintain 72 px primary text insets.

## Frame plan and causality

| Time / frames at 30 fps | Picture and action | Meaning |
|---|---|---|
| 0–1.4 / 0–42 | Held title; six ivory documents enter from left in 0.11-second offsets and settle into a 3-column, 2-row grid. IDs 01–03 above, 04–06 below. | Establish a countable set of six. |
| 1.65–2.9 / 50–87 | A thin mint cursor scans left to right. As it reaches the right column at about 2.67 seconds, requests 03 and 06 turn mint and gain selection frames. | Review causes selection; identities remain unchanged. |
| 3.2–4.5 / 96–135 | Headline changes to “Defer four. Approve two.” Requests 01, 02, 04 and 05 mute in place and gain DEFERRED labels; selected pair gains APPROVED labels. Four deferred requests remain readable on the left. | Six resolves into the complete 4 + 2 split. |
| 4.65–5.1 / 140–153 | Next-workspace heading, boundary and two aligned slots appear at right. Selection frames leave. | Prepare a destination before travel. |
| 5.15–6.28 / 155–188 | The actual request 03 and 06 layers travel to x=1041 at unchanged y=321 and y=471, staggered by 0.13 seconds. | Matched carry: no replacement, duplicate or count reset. |
| 6.7–9 / 201–270 | “Two approved requests carry forward.” Full accounting reads “6 reviewed / 4 deferred / 2 approved”. Hold all six original IDs and both destinations still. | Readable outcome and a clean end frame. |

The document centers begin at x=240, 500, 760 and y=321, 471. The two remaining columns stay anchored during transfer. Destination slots share the carried documents’ centers; the new workspace occupies x=891–1193. Native parent nulls carry the complete document bodies, IDs, content lines and status labels together.

## Implementation and review contract

The supplied build is a standalone ES3 function body for eval.run. It creates one uniquely named comp and only its own native layers. It returns created comp IDs. There are no imports, private library calls, project switch/save/close/clear calls, render calls, viewer activation or undo calls.

Timing and hierarchy are deliberately editable via named native layers and composition markers. There is no required external control rig. Provisional color constants are in the script; once built, native fill and text properties remain available.

Before calling the visual finished, inspect frames at 0, 1.4, 2.2, 2.8, 3.4, 4.9, 5.65, 6.3 and 8 seconds. Check text bounds, glyphs, the scan’s selection contact, document collisions, aligned target slots and clear final counting. Play all nine seconds at speed. Runtime execution, actual font resolution and rendered visual QA are not performed in this authoring-only test.

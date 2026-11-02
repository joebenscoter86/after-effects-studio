I propose **“Back into circulation”**: one terracotta book travels through a return slot, receives a check-in confirmation, and settles onto a display shelf for its next reader. Its cream spine and small sun emblem stay recognizable throughout.

The feel is warm and editorial: ivory ground, charcoal lettering, muted sage accents, generous space, and restrained movement. The book carries the story; short labels explain each stage. No narration is needed.

| Time | Story and motion | Proposed wording |
|---|---|---|
| 0–3 seconds | The book is already moving toward a return slot. It slips behind the lip and emerges into a simplified cutaway tray below. A slight tilt settles as it lands. | **Return** |
| 3–6 seconds | The same book leaves the tray and slides onto a check-in pad. A narrow scan passes across its barcode; only after the scan completes does a sage check draw beside it. | **Check-in** |
| 6–10 seconds | The book leaves the pad and travels to a small face-out shelf. It settles between two quiet companion books. The final line appears, then everything holds still long enough to read. | **Ready for the next reader** |

**Construction-ready plan — proposed defaults**

- **Format:** 1920 × 1080, landscape, 30 fps, exactly 300 frames. The wide frame makes the left-to-right journey easy to follow. Frame ranges below use an exclusive end; the last visible frame is 299.
- **Visual operation:** returned → checked in → available. This is an illustrative library workflow, not a depiction of a particular library’s equipment.
- **Composition:** static camera; return station left, check-in center, shelf right. Each destination gains detail as it becomes relevant. Completed stations remain subdued long enough to show where the book came from.
- **Art:** purpose-built, editable geometric illustrations: book cover, page edge, spine, sun emblem, barcode, slot, tray, scanner pad and shelf. Subtle tonal variation and attached contact shadows give warmth without requiring supplied artwork or photorealism.
- **Typography:** proposed Georgia Regular, subject to later availability verification; fallback to an available readable serif. Stage labels approximately 52 px; final line 64 px. All copy stays within 120 px margins, above the moving objects. No invented book title or additional wording.
- **Sound:** silent by default. Motion and labels communicate the complete sequence.
- **Library foundation:** `motion-language`, `production-workflow`, `brief-template`, `construction`, and `worked-scenes`, particularly its persistent-object transfer guidance.

| Beat / range | Frame-specific action and resolved pose | Reading hold |
|---|---|---|
| **Return — 0–3s / f0–90** | Book visible and moving at f0; slot crossing begins f18. The foreground lip occludes the book naturally while the cutaway preserves its identity. Tray contact at f54; a small landing tilt resolves by f66. | “Return” fully readable f12–84; book rests f66–84. |
| **Check-in — 3–6s / f90–180** | Book departs tray at f90, leaving it visibly empty. Pad contact at f114; settles by f120. Scan crosses barcode f126–144. Confirmation draws f147–156, after scanning finishes. | “Check-in” fully readable f102–174; confirmed state holds f156–180. |
| **Ready — 6–10s / f180–300** | Book departs pad f180 and reaches shelf f216. Shelf contact precedes a gentle settling motion, complete f228. Final copy reveals f228–240. | “Ready for the next reader” stays fully readable f240–299: two seconds of stillness. |

**Continuity and future build checks**

One book assembly persists for all 300 frames, with its center pivot and cover details attached. It moves directly between stations without a decorative route line. Travel uses smooth acceleration and a longer deceleration; only contact produces a small settle.

The hardest passage is the slot occlusion and emergence. A later build would first test that passage alongside the ordinary scan-and-confirm beat. Review frames would include slot entry, maximum occlusion, tray contact, and the neighbors of each transfer: f89/90/91, f113/114/115, f179/180/181 and f215/216/217. The checks are visible continuity, an empty source after departure, confirmation after scanning, attached shadows, and unobstructed final text.

A future editable build would use a new `LIB_BookJourney_10s` composition with separately editable book, stations, text and keyframes. Fonts and visual results remain unverified until execution.

This proposal is ready for your approval. I read only the installed candidate’s skill and bundled library; no files were written and After Effects was not accessed.
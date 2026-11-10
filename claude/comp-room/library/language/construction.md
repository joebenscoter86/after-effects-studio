# Construction, timing and gesture grammar

Adapted from the October 6 and October 15 motion playbook and the two house-polish scene scripts. The numbers below preserve the useful craft detail. They describe a proven fast explanatory style at 30 fps, not all genres. A measured N-frame gesture at 30 fps lasts N/30 seconds; preserve that duration at another frame rate unless intentionally changing the pace. Quantize boundaries to the target composition grid, not a hardcoded 30-fps timeline. If choosing a different pace, write the reason and preserve the sequence of attention.

## Anatomy of the explanatory section

A 2.5–6 second section holds one visual idea. The original grammar used a held title, one evolving picture, roughly 12–16 overlapping events, and a new small event every 6–10 frames. An event is a visible addition or state change, not a keyframe. Don't hit the quota by adding meaningless flashes. A documentary proof hold or slow title may deliberately use fewer events.

Order the construction: baseline / guide → outline → hero material → selection / detail → action → consequence → reading hold → hand-off. Let the next supporting action begin before the previous one finishes. Start the object already moving instead of revealing a static finished picture and then animating it.

## Easing, explicitly

| Function | Out influence | In influence | Starting duration at 30fps |
|---|---:|---:|---:|
| Settle into place | 28 | 85 | 13–15 frames for the larger arrival |
| Deliberate travel / fill | 82 | 82 | Fit the state change and narration |
| Accelerating exit / collapse | 75 | 12 | Often 3–7 frames per gesture |
| Pop impulse | linear | linear | 3 frames, followed by a spring |

The pipeline's mining found one transform property per layer in 81% of measured transform entrances; offsets commonly lived between components rather than Position + Scale + Opacity on every layer. Use this as a complexity warning, not an absolute ban on multi-property action. Sample: 307 unique moves from 66 files across template packs; pack duplication/style concentration limits generalization. No reach or audience claim follows from those counts.

For the spring, sample incoming velocity just before the last key and add `v * 0.05 * sin(2.6 * t * 2pi) / exp(6.5 * t)`. The measured peak was around 17% of travel. These values are included in `motion-jsx`. For a picture resting at 24% scale, animate multiples of 24, not a reset to 100. Key linear impulses explicitly.

## Stagger and anticipation

- Handles and small badges: 2–3 frames apart; adjacent title lines: about 2 frames.
- A many-object cascade follows the sweep's actual crossing time, rather than a generic delay by index.
- Separate objects: 0.15–0.2 seconds as a starting point.
- Anticipation stays smaller than the action: the reference leaned about 25px or lifted a dot 18px. Scale distance with composition size; don't turn anticipation into a second main event.
- A VO-linked object often starts 0.1–0.25s before its word so it lands on the word. Transcribe the actual locked audio and check the word onset; draft script timing is not sufficient.

## Line → material → accent

Native trim paths, crop marks, guide lines and handles create an intelligible construction. In the original, guides ran beyond the stage at 1.8px with a 9/7 dash-gap; scale line weight for the output resolution. Keep construction crisp. Material may be a well-made cut-out or native geometry appropriate to the subject. Bring the accent on the semantic turn, then cut away construction on the snap.

An outlined generic icon is not equivalent to a premium material object. The pipeline improved when asset design and motion design were both addressed; adding better easing to weak artwork did not solve it.

## Collapse and removal

Quick delete: scale relative to the resting size toward `[112%,4%]` over 3 frames, then end the layer. Longer collapse: flatten to a sliver (4f), close to a dot (3f), wind up (2f), drop (4f). Retain the spatial center so the viewer reads one transformation. A receiving slot can react with one small spring. Hold the empty/clean state long enough for the consequence to register.

## Shared whip hand-off

Outgoing y offsets over seven frames: `[0,-8,-26,-66,-150,-430,-760]`.
Incoming offsets over eight frames: `[640,300,118,56,26,11,4,0]`.
One outgoing frame carries about 40% of the travel. Introduce the new scene on that fast frame and preserve the travel direction. These are sampled positions; use linear interpolation between samples. Scale distances to cover the current stage. Test the transition at native frame rate, including motion-blur shutter samples.

## Scene structure

Group related layers beneath a dedicated scene null, establish its anchor and position before parenting, and key it only after placement. Children retain their own internal event timing while the carrier performs the hand-off. A traveling star that bridges sections must outlive the first section's outPoint. Keep typography screen-locked or scene-locked intentionally; do not accidentally inherit a whip.

## Native construction checks

These are implementation safeguards, distinct from the optional measured style above.

- Record resting scale, position and anchor before animation. Footage scale is relative to its source pixels; key multiples of the resting scale rather than resetting to 100%.
- Establish a carrier at its rest pose before parenting. Never parent into a zero-scale transform. To preserve comp-like child coordinates under an unparented identity carrier, set its anchor and position to the same chosen pivot before attaching children; a nested carrier instead uses its parent's coordinate space. Verify a known point at rest and in motion.
- Parenting already-keyed children can rewrite their world transforms. Discover the native parenting operation's compensation behavior, set intended local transforms explicitly and inspect before/after. Parenting does not determine visual stacking.
- In AE shape contents, earlier vector groups render above later groups. Put fold strokes and detail above fills intentionally. In the layer stack, place text and foreground rims explicitly; inspect the result rather than relying on creation order.
- Adding a sibling to an indexed property group can invalidate a saved Property reference. Re-fetch handles after additions; use stable layer IDs and discovered match-name paths. Use the actual property dimensions, not assumed 2D arrays. Do not guess display names for rotation, masks or effects.
- Inspect expressions and keys on every targeted property before changing them. An unknown expression is a conflict to preserve, not permission to overwrite. Scope removal to the intended owned animation and report uncertain partial mutations.
- Changing startTime or setting in/out points can shift keys or extend a layer unexpectedly. Read back the resulting spans and keep visibility intervals frame-exact. Carried objects outlive the outgoing scene; ordinary layers stop at their intended boundary.
- Match the contact geometry: a guide, fluid surface, paper label or shadow must follow the object's actual bounds and transform. Test intermediate frames, especially during tilt/scale; correct endpoints alone do not prove the path.

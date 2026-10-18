# Editable typography mechanisms

Load typography-jsx. Start with fitted, readable copy and an inspected owned layer. These mechanisms keep full editable Source Text in place. They do not split text; no copyMap is required. Preserve reading order and adequate settled time; an entrance is not the message.

```js
AESType.reveal(layer, {
  owner:"scene-unique", ownedLayerIds:[layer.id],
  technique:"clean", unit:"word", start:0.25, duration:0.75, intensity:0.35
});
```

- clean: opacity plus a small vertical arrival, preserving the rest position. intensity:0 gives the lowest-motion choice: fade only.
- stagger: native range-selector opacity, based on word or line. Full copy stays in one text layer; spacing and native line layout remain intact. Intensity is validated but this mechanism uses the selector's fixed fade profile; duration controls its pace.
- masked: editable native mask path sweeps across source bounds. Position stays fixed; intensity does not alter mask geometry. Use for an intentional reveal, not default decoration.
- impact: opacity and restrained scale overshoot relative to the original scale. Lower intensity reduces both entry scale difference and overshoot. It settles back to the exact rest scale.

Plan each property’s complete animation before calling a helper. For example, reveal keys Opacity, so replacePhrase will correctly refuse that same already-animated source. For a combined entrance/replacement, author the complete opacity curves with verified native operations, or use separately owned layers; do not erase existing keys just to satisfy a helper.

All target properties and owned identity are checked before writes. start/duration must lie within layer and comp; units are seconds, independent of frame rate. Existing Source Text expressions/keyframes, targeted transform animation, any text animators, and existing masks for masked reveal are conflicts. Repeating on already animated targets returns conflict; it does not silently stack another animation. Native text/mask additions are identified in created entries and property paths in targets. After partial native failure, uncertain:true means inspect those identities before any retry. No bulk cleanup is performed.

```js
AESType.replacePhrase(comp, {
  owner:"scene-unique", ownedLayerIds:[source.id,target.id],
  sourceLayer:source, targetLayer:target,
  start:1.25, duration:0.5, align:"left"
});
```

Phrase replacement aligns the measured left/center/right glyph edge and measured top edge, then fades out the source before fading in the target. Both layer identities and complete copies remain available; opacity hides the retired phrase. The source stays visible before start and the target remains visible after end. A brief empty midpoint avoids colliding copy. The result includes sourceLayerId, targetLayerId and targets.

Alignment initially supports unparented 2D text, zero rotation and positive scale. Parent, 3D, separated Position and preexisting animation on alignment properties are refused before mutation. It accounts for differing glyph bounds, anchor points and positive scales. It does not promise to preserve a common font baseline across different faces; it aligns glyph tops. Provide already fitted copy. Horizontal Latin is the current scope; do not use these helpers to reshape unsupported scripts.

Native fixtures at 24/30/60 fps cover all mechanisms, including word and line stagger, start/action/landing, exact timing, repeat conflicts and meaningful copy replacement. Source repository evidence: quality/reports/2026-10-16-type-animation/report.md. Frame review and timing verification establish implementation behavior; they are not a full-speed creative acceptance or publication approval.

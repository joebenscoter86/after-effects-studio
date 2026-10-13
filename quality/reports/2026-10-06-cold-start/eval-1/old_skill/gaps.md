# Guidance gaps and assumptions

- The bundled library gives useful general scene contracts and a selection recipe, but no complete reference inbox composition, geometric layout system, measured typography rules or native-document construction helper. The six-document layout and exact scan/carry timing were designed for this prompt.
- Requested 9 seconds and 1280×720 are honored. 30 fps is an inferred routine choice. Selection of request IDs 03 and 06 is fictional illustrative data, not a real decision.
- ArialMT is a provisional font guess; no host/font lookup was allowed. Actual glyph fallback and text bounds need AE verification. The script aligns text using sourceRectAtTime.
- A new null-layer source asset is created by AE for each request; these are scene-owned native assets. No external or private asset dependency exists.
- No runtime behavior, image captures, exported file or playback could be tested under authoring-only scope. Native API signatures use ordinary AE knowledge plus the bundled scripting reference.
- The plugin recommends useful exposed controls but does not specify a standalone control contract. This build uses named native properties and timeline markers, without a custom rig.

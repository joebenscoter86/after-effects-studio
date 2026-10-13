# Ceramic grinder launch — concrete production plan

A faithful luxury final needs the actual grinder and verified product copy. With only After Effects open and no product assets or image-generation tool, the useful work now is the shot design, timing and editable layout plan. A generic cylinder or invented grinder would only be a **BLOCKOUT — NOT THE REAL PRODUCT**, not a finished launch animation.

Please provide the real product's model name, exact price and currency, target aspect ratio, and either a usable 3D model or real footage of a controlled orbit/turntable move. If only photographs are available, send the highest-resolution front and three-quarter images, with permission to use them; we can make a faithful still-based reveal and restrained push, but those pictures cannot supply a real continuous orbit or an unseen side. Include any required wordmark, finish/colorway, approved product reference and price qualifications. These inputs change the actual product, promise and deliverable; I will not invent them.

## Proposed eight-second film

Assume 1920×1080, 16:9, 30fps, 240 frames until the delivery format is specified. The grinder is the continuous visual anchor. Warm ceramic texture and one controlled orange edge are the hero; text stays spare and screen-locked. Ground is near-black #080707, burnt-orange lighting family #B84921, and type warm off-white #F4EAE0. Treat these as an art direction starting point, not a claim that the real product has an orange material.

| Time / frames | Camera, light and object operation | Reading job |
|---|---|---|
| 0.00–0.70 / f0–21 | Begin close on a recognizable shoulder/rim or grinding adjustment detail. An orange edge resolves the silhouette before broad ceramic detail. Keep some visible highlight from the first frame instead of a long blank black lead. | Product recognition before copy |
| 0.70–4.80 / f21–144 | One continuous slow 15–25° move around the actual product, calibrated to its geometry. Reveal the body, material and functional detail in sequence. Camera targets the grinder; product stays stable. Maintain a soft neutral key and controlled burnt-orange rim so the ceramic color/texture remains credible. | Let the object explain its craft |
| 4.80–5.40 / f144–162 | Ease into the final three-quarter view and lock framing. Settle the contact shadow and preserve negative space at the right or below according to format. The move reveals the chosen final silhouette rather than orbiting for its own sake. | Prepare space for identification |
| 5.20–5.60 / f156–168 | Native model name reveals as a whole phrase using a restrained matte or 10–14px offset. No scale bounce. Start only after the product has nearly settled. | Exact verified model name |
| 5.60–6.00 / f168–180 | Verified price/currency follows, plus any required qualifier. Typographic hierarchy: name first, price second. | Exact verified price |
| 6.00–8.00 / f180–239 | Hold the hero and both lines for two seconds. Either completely still or no more than a 1% residual drift, selected after checking readability. | Final product, name and price |

The draft contains no literal invented model name or price. A staging comp may show “[MODEL NAME REQUIRED]” and “[PRICE + CURRENCY REQUIRED]” with an obvious blockout label; these must never be mistaken for factual final copy.

## Asset route and lighting contract

**Best route for a newly designed orbit:** an accurate 3D model with correct proportions, separate relevant pieces, UVs and ceramic/base material textures. Confirm ownership/use rights and that it matches the actual finish. Inspect an actual preview before committing to a camera angle. Verify the installed AE version and renderer supports the chosen model/material route. If it does not support the required product rendering, request a prepared rendered turntable/orbit pass rather than promising that a flat AE layer will substitute. Do not assume a paid 3D renderer, model importer or external account is installed.

Render/prep ideally supplies beauty with alpha, shadow/contact pass, and optional reflection or material isolation passes. Match output resolution or better, frame rate, perspective and a fixed product pivot. No baked model name or price. Keep the ceramic texture natural; tiny specular variation and broad soft highlights should establish ceramic, while the burnt-orange edge remains a lighting cue. Avoid broad orange tinting that misrepresents the finish, clipped rim highlights, plastic gloss or crushed shadows that erase the shape.

**Equally faithful route when available:** real product footage already performing a slow camera orbit or turntable move under controlled black/orange studio light. AE handles the grade, cleanup, typography and composite. Inspect source frame rate, shutter, detail, motion duration and highlight clipping. A previously baked camera move cannot be freely retimed or reframed without limits; conform to what the recording actually supports.

**Photos-only route:** preserve the supplied three-quarter image's true silhouette and viewpoint. Separate product from the original ground with careful alpha, rebuild a coherent contact shadow only if needed, and use a modest 2D push/light reveal. Call this a still-based reveal. A perspective warp or a flat card rotated in 3D cannot honestly provide the requested real-product orbit. A multiview image sequence can support an orbit only if views and lighting are sufficiently dense and consistent; verify actual assets before promising continuity.

## AE construction

Begin with live host version/context and catalog discovery once execution is in scope. Preserve the open project. Create owned, uniquely named comps for the product shot, native title/price treatment, and final eight-second assembly, with paths/prefixes documented. No assumed personal MASTER, CAMERA rig, custom font, media folder or generation provider.

Use a true camera only if the product route carries genuine 3D geometry/parallax; otherwise composite the actual filmed orbit, or use the explicitly agreed still-based alternative. Keep the light/camera relation coherent and typography in screen space. Add an actual opaque black ground layer with sufficient coverage. Use the same actual product identity from reveal through hero; do not replace it halfway with an approximate stand-in. Easing is one deliberate slow move, not the explanatory scene's 6–10 frame event cadence.

Use an installed, verified brand font or a suitable available restrained sans serif. Measure the actual name and price with `sourceRectAtTime`, account for the currency glyph, and design a line break before shrinking the text. The final product silhouette and text must be checked together at the requested aspect ratio. Any supplied logo remains faithful native/vector artwork when possible.

Audio is not required by the prompt. This plan defaults to a silent film. Add music or sound only if requested and available with appropriate usage rights; it must not be used to hide unclear motion.

## Representative test and finish gates

Before building the complete film, test the hardest material/camera passage (edge reveal into three-quarter view) and an ordinary hero-plus-price hold using the real asset. These are self-review milestones, not additional approval gates unless the user wants direction choices.

Inspect rendered frames at f0,12,21,60,105,143,155,168,180 and239, with denser samples around any matte/compositing handoff. Compare the product's geometry, finish and identifiers to the supplied source. Check alpha edges on the final black ground and a temporary light ground, coherent contact/reflection, visible ceramic detail, absence of light flicker, text overlap, actual name/price/currency accuracy and clipping at maximum framing. Play the rendered eight seconds at speed for camera rhythm and the two-second reading hold; a contact sheet cannot validate those qualities.

Final deliverables after asset and factual dependencies are resolved: editable AE project with collected permitted assets, a review video and requested final codec/format. Verify metadata (eight seconds, agreed size, fps, streams) and full decode; hash-match any delivery copy. Keep technical validation, visual judgment and user acceptance distinct.

**Open dependencies:** actual grinder image/model/orbit footage; exact model name; exact price/currency/qualifiers; final aspect ratio; installed host/renderer/font capability. Until those are resolved, a faithful final is not possible. No AE operation, asset generation, render or product claim has been made in this test.

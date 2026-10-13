# Asset design and material quality

The original pipeline's breakthrough required both carefully made objects and native choreography. Keep that division portable: the plugin does not require a particular generation service, the user's private asset kit, or a paid template pack.

## Resolve inputs before committing the visual plan

Inspect supplied assets and available libraries before writing a brief around them. Render a contact sheet or open the actual asset: catalog descriptions have misidentified arrows as checks and full-frame grids as corner brackets. Record the real file, intended use, preparation and source/rights status in the brief. A missing file is a dependency, not a license to imply it shipped.

For each object choose: supplied artwork, user-owned library, licensed stock, generation through an available provider, or intentional native geometry. Organic/recognizable physical objects need appropriate artwork. Isometric boxes, pages, diagrams and geometric UI can be built natively when that is the chosen language. Do not repeatedly reuse the same boxes for unrelated analogies.

## Motion-ready asset contract

- Consistent viewpoint: front-on orthographic for a card-like object that swings/flips; a consistent isometric view for a dimensional illustrated world.
- Consistent light direction and material across a set.
- Alpha or a flat key background selected so it does not erase important object colors.
- No ground shadow, baked text, numbers or unintended logos when those belong in AE.
- Separate pieces for independent motion: lid, front rim, badge, pointer, screen contents.
- Match two states by measured shared geometry and baseline, not equal nominal image dimensions.

### Parametric object prompt

“One [object], [viewpoint], [material and shape language], [palette tokens mapped to parts], consistent [light direction]. Isolated on [transparent or flat key ground]. No cast shadow, no text, numbers or extra objects. [Specific blank area] remains completely blank. Generous margins around the silhouette.”

### Illustrated isometric variant

“[Object doing its action], consistent isometric three-quarter view, clean editorial illustration. Flat fills, three tonal shades per color, thin uniform outline in [ink token], parts in [palette mapping]. No gradient, texture, text or ground shadow; isolated on [ground].”

These are reusable art specifications, not claims about any provider's current schema or output. Inspect every result. When generation is unavailable, use supplied/native assets appropriate to the brief or request the missing product artwork. Label blockouts; don't present them as the final material treatment.

## Keying and alpha

Border-connected background removal preserves enclosed white/cream areas inside outlined art better than making all white pixels transparent. Chroma extraction needs despill and edge inspection. Choose a background distinct from shaded subject colors; blue shadows on a white subject can be destroyed by a broad blue key. Inspect small details against the actual final ground, especially if moving from a dark to a light background.

For live-action green screen, measure each take's screen color and inspect hair/hand gestures. A key that hides residue over a dark room may reveal a grey block over pale paper. Match takes before the creative grade. These are conditional compositing techniques, not dependencies for a motion-only scene.

## Shadows and occlusion

Use one consistent light direction. Two shadows can provide contact plus lift. The paper-object study used contact distance 5/softness 12/opacity 70 of 255 and lift distance 30/softness 64/opacity 46 of 255 at 1080px width, direction 135, dark blue color. Adapt to object size, surface and look; do not apply these values to every genre. Normalize any 0–255 values to the installed effect's actual units.

In an isometric native object, the source kit lightened the top face by 16%, darkened one side 14% and the other 34%, with a thin shared outline. This gives a reproducible starting light model. Separate visible side faces correctly and inspect draw order. Do not render all box faces over one another inside a cabinet.

## Exact surfaces

Measure a blank device's screen rectangle after cutting it out; place native UI and a matte into that measured region. Use actual source recordings/screens for evidence. Product icons retain their authentic identity where supplied. Generated art must not fabricate a financial result, transcript, product capability or other evidence.

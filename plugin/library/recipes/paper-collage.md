# Native paper and cutout recipe

Use this recipe for a cut-paper material treatment when the brief calls for collage. Read `motion-language`, `production-workflow` and `brief-template` first. This helper creates editable AE shapes and uses built-in Roughen Edges, Noise and Drop Shadow effects. It does not fetch art, generate a raster texture, or require JoeB assets. The marks are intentionally subtle; texture, edge and shadow values are approximations, not a scanned paper stock.

Load `scripts/paper-collage.jsx` with `eval.run`, then call the ES3 global `AESCollage`. Inspect the exact project and use a unique `owner` and explicit layer IDs. Do not run a fixture in a user's unrelated project.

```js
var card = AESCollage.paper(comp, {
  owner:"scene-unique", name:"Paper card", width:900, height:500,
  color:[0.94,0.91,0.84], texture:0.2, border:0.3, shadow:0.4,
  intensity:0.4, stepHz:12, seed:123
});
if (!card.ok) return card;
var cutout = AESCollage.treatCutout(existingOwnedCutout, {
  owner:"scene-unique", ownedLayerIds:[existingOwnedCutout.id],
  texture:0.2, border:0.3, shadow:0.4,
  intensity:0.4, stepHz:12, seed:123,
  keyedProperties:["ADBE Transform Group/ADBE Position"]
});
return {card:card,cutout:cutout};
```

Both calls return `{ok,created,warnings}`. `paper` also returns `layerId`, `shapePaths` and `effectPaths`. `treatCutout` returns `layerId`, `changedPropertyPaths` and `createdEffects`. Errors before writing return `INVALID_ARGUMENT`, `CONFLICT` or `UNSUPPORTED` with no edits. A native failure after a write returns `NATIVE_ERROR`, `uncertain:true` and whatever created IDs were captured. Inspect those IDs before retrying.

Dimensions must be positive and finite. RGB, texture, border, shadow and intensity are each in `[0,1]`. Seed is a nonnegative safe integer; `stepHz` is positive and no higher than the comp frame rate. At intensity zero, no stepped position or rotation expression is added. A treated cutout must be a two-dimensional non-text layer with an explicit owned ID. Existing expressions on targeted position or rotation are a conflict. Existing keys are allowed only when that property path is listed in `keyedProperties`; `value` in the expression preserves the pre-authored keyframed base motion. Reapplying to an already treated layer returns a conflict instead of stacking another material treatment.

The stepped motion samples `Math.floor(time * stepHz)` and an explicit seed. It never uses layer index or global random state. At 24 and 60 fps, 12 Hz falls evenly on frames; at 30 fps it alternates two- and three-frame holds. This is a sampled-time rule, not a promise of equal frame cadence at every fps. Choose lower intensity or zero boil when the material should remain calm. Keep text readable on a separate layer; the cutout helper rejects text layers.

## Editable ink on real paper

When a supplied or generated paper stock looks physical but text looks pasted on, first treat the AE text layer as ink. Keep the words in Source Text. This is a native effect recipe for owned text, separate from `AESCollage.treatCutout` (which intentionally rejects text). Use an installed, verified font that fits the brief. A system font in a local example is not bundled with the plugin and may substitute elsewhere. Check `sourceRectAtTime` at the final delivery size after any font change.

The MS-06 material study tested this starting treatment at 1080×1920, 30 fps: dark-green ink `[0.19,0.26,0.20]`; Multiply blend; peak layer opacity 88%; Roughen Edges with Border 1.25, Edge Sharpness 0.65, Fractal Influence 0.32, Scale 22 and Complexity 2; and Noise Alpha Amount 16. Use a stable seed per text layer. Align the text rotation to its paper card (roughly half a degree in this study). The Multiply/opacity combination lets fibers and tonal variations remain visible inside the strokes; Roughen Edges and Noise Alpha break the sterile vector contour. Those are measured starting values, not universal defaults. At small type sizes reduce the wear before the counters close or strokes disappear. Avoid a Drop Shadow on text.

For a short hand-written entrance, keep the material static and use a native Text Animator with Text Opacity 0, a Range Selector based on characters, Randomize Order off and Smoothness about 22. Animate the selector Start from 0 to 100 over roughly 1.1–1.3 seconds after the paper settles. The effect reveals characters in reading order; it does **not** trace each glyph's pen stroke. Test the first and second lines in rendered intermediate frames and watch the full-speed clip. If that sequence reads like typing or distracts from the message, use a short whole-line ink fade instead. For a calm variant omit sequential reveal and alpha noise if either produces visible flicker.

Keep the text and card spatially registered through any movement. In the MS-06 study the text appears only after each card has settled; if text must ride on moving paper, parent at rest or copy the card's transform deliberately and inspect the transition. Replacing a paper image need not replace or rasterize the words. A specific font may be unavailable on another platform; preserve the text layer and choose a similar installed face, then recheck bounds and line breaks.

## Optional handwritten-paper plate

Use this only when the brief calls for convincing ink physically absorbed into photographed paper and the editable treatment does not meet the visual target. A generated paper image with exact lettering can produce a stronger material result, but the **visible** words become raster pixels. Preserve an AE Source Text layer with the exact copy as the authoring record; mark it as a source requiring asset refresh after edits. Do not claim that changing Source Text alone updates the rendered words. Keep the blank paper stock and a generator-free text treatment as fallbacks, and do not make an image account a prerequisite for ordinary collage work.

For each card, make a distinct generated asset from the approved blank paper and provide the exact copy, line breaks, ink color and material reference. Inspect spelling, punctuation, fiber detail, alpha edge and altered paper lighting at full size. A model rendering one phrase correctly is not proof that arbitrary copy will be correct. Never replace a shared footage item to update one card: import separate footage items and use `AVLayer.replaceSource` on only the intended owned layer. To preserve entrance timing, place a masked printed-card duplicate over the original blank stock with matched transforms; animate a feathered lettering-region mask so the ink appears after the paper arrives. Check that the mask changes only the lettering region and that the paper does not visibly flash. Keep the generated media with the project or collect/relink it before delivery; a local AEP with ignored PNG paths is not portable by itself.

The MS-06 optional study and its `ms-06-handwritten-assembly.jsx` reproduce one three-card example in the dated quality report. The letters are generated raster material; the rest of the AE motion, masks, shapes and source-copy layers remain editable. If a user changes copy, regenerate the affected plate, verify the exact words, relink only its footage layer, and re-render the reveal. This is an explicit asset-refresh workflow, not live editable typography.

For a complete scene, use the material treatment to make a causal assembly: identify the first object, the pieces that join it, the overlap that reveals a new state and the final readable payoff. Hold labels long enough to read; do not step their movement merely because paper pieces step. The calm variant sets `intensity:0`, avoids flicker and camera travel, uses fewer layer arrivals and gives the final card more settled time. This is a creative motion choice, not an accessibility certification. A supplied cutout may be treated after checking its alpha edge, resolution and rights; optional generation is never a hidden dependency of the native route.

Inspect edges, shadow separation, seams, alpha halos and stacking at full resolution. Compare decoded pixels from repeated seeded renders, including after inserting an unrelated layer. A successful helper call or mock test does not establish visual quality.

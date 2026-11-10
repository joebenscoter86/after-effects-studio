# AE implementation notes

ExtendScript uses ES3: var, function expressions, ordinary loops and concatenation. The runtime supplies JSON utilities and AE helpers, but a standalone JSX file may not. Return a small JSON-serializable result with created IDs/counts and useful readbacks. Add breadcrumbs for long scripts. Avoid app alerts and modal dialogs.

- Before calling spatial methods, gate on `propertyValueType === PropertyValueType.TwoD_SPATIAL || propertyValueType === PropertyValueType.ThreeD_SPATIAL`; avoid relying on truthiness of `isSpatial` alone. Use dimension-matched easing arrays for ordinary TwoD/ThreeD properties and a single ease object for spatial and scalar properties.
- Inspect spatial property dimensionality from the host, even for a visually 2D layer. Layer Position can expose three-component values; build zero tangent vectors from `prop.value.length` for `setSpatialTangentsAtKey`, not a hardcoded `[0,0]`. Spatial temporal easing uses one `KeyframeEase` per key; that does not imply one- or two-component spatial tangent vectors. Validate these separately.
- New layers are added on top. Use explicit moveBefore/moveAfter when stacking matters. Shape groups have their own draw order; render overlaps.
- Adding a sibling to an indexed property group may invalidate property references. Reacquire handles after additions.
- Parent while the null is at rest; never parent to zero scale. Set parent anchor/position intentionally. Normal parenting preserves world transform at that moment; set local coordinates afterwards if needed.
- Use sourceRectAtTime to size and align actual text. Source Text position is a baseline, not a top-left corner. Test variable font instances and glyph availability.
- Native scripting can set startTime, inPoint and outPoint. Old cloud bridge limitations on time sliding do not apply to this runtime.
- For masks use match names (Mask Expansion is ADBE Mask Offset). Trim Path End stays within 0..100. Re-fetch properties rather than holding stale references across additions.
- Use named effects/match names discovered from the installed host. Custom effect UI parameters are not always scriptable. Apply a valid .ffx preset when a custom LUT picker cannot be set; isolate selection first.
- Import local assets after checking existence and decoding them. New filenames avoid stale footage cache after re-encoding. Verify duration, alpha interpretation, frame rate and color space.
- Use scene-specific prefixes for idempotent rebuilds. Remove only layers owned by that scene; never bulk-remove a user's project to make a demo repeatable.
- Color-managed frame captures can use temporary layers and calibration comps. For a strict inspection-only session use AE_MCP_READONLY=1 and review any colorWarning.
- A native render can block AE. Use intentional render settings, one controller at a time, and a timeout appropriate to the job. A timeout is uncertain completion, not permission to resubmit.

## Effect value scales

Scripting does not always use the scale the Effect Controls panel shows. Before writing effect values, call `effect.describe` for the effect: each row gives the value type, the current value and, where After Effects reports them, `minValue` and `maxValue` in scripting units. `effect.set_property` refuses a value outside that range, or of the wrong type or number of dimensions, and names the valid range; nothing is written. A property with no reported range is written as given. If After Effects' reported range is itself wrong, pass `skipCheck: true`. Colours are 0 to 1 per channel in scripting.

Observed in After Effects 2027 (27.0), from the 2026-11-09 limits test:

- Gradient Wipe: Transition Completion takes 0 to 1 in scripting; the panel shows percent. A write of 25 failed with "Value 25 out of range 0 to 1".
- Gradient Wipe: Transition Softness takes 0 to 1 in scripting; the panel shows percent.
- Threshold: Level takes 0 to 1 in scripting, not 0 to 255 as in the panel. A level written on the panel's scale renders pure black.

Not yet verified: Glow's Glow Threshold. The library's styles write 20 to 92 and describe them as percent, which fits a 0 to 100 scale, not 0 to 255. Read the range with `effect.describe` before relying on either.

## House library integration

The optional `house-jsx` and `joeb-motion-jsx` are real extracted pipeline code. They require a MASTER composition with the documented JoeB rig, correct fonts, media and AES_HOUSE_CONFIG paths. They are not a blank-project template. Use `motion-jsx` for independent scenes. Read `joeb-preset` before selecting these helpers.

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

## House library integration

The optional `house-jsx` and `joeb-motion-jsx` are real extracted pipeline code. They require a MASTER composition with the documented JoeB rig, correct fonts, media and AES_HOUSE_CONFIG paths. They are not a blank-project template. Use `motion-jsx` for independent scenes. Read `joeb-preset` before selecting these helpers.

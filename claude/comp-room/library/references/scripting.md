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

Scripting does not always use the scale the Effect Controls panel shows. Before writing effect values, call `effect.describe` for the effect: each row gives the value type, the current value and `minValue` and `maxValue` in scripting units, with `rangeSource` saying where the range came from. `effect.set_property` refuses a value outside that range, or of the wrong type or number of dimensions, and names the valid range; nothing is written. A property with no range is written as given. Colours are 0 to 1 per channel in scripting.

Where the range comes from:

- `"after-effects"`: as After Effects reports it (`hasMin`, `minValue`, `hasMax`, `maxValue`). Usually right.
- `"known-scale"`: from the table `AE.KNOWN_EFFECT_SCALES` in `runtime/jsx/helpers.jsx`, for properties whose reported range is wrong. The row also carries `reportedRange` and `rangeNote`. This table, not After Effects, is what stops a wrong-scale write on those properties; a property After Effects reports wrongly and the table does not list is not protected. To add one, test it live, add `{ min, max, note }` under its matchName and a line here.
- `rangeUntrusted: true`: After Effects reported a bound of 30000 or more from zero (for example -30000 to 30000, or plus or minus 3.9 million on a colour). That is its placeholder for no real limit. Writes are still bounded by it, as After Effects itself would bound them, but it says nothing about the useful scale.

`unitsText` cannot be trusted as the scale: Glow Threshold says "percent" and takes 0 to 255. If a known or reported range is itself wrong, `skipCheck: true` writes without the check.

Observed in After Effects 2027 (27.0), from the 2026-11-09 limits test and the 2026-11-10 stage 5 live checks:

- Gradient Wipe: Transition Completion takes 0 to 1 in scripting; the panel shows percent. A write of 25 failed with "Value 25 out of range 0 to 1". After Effects reports this range correctly.
- Gradient Wipe: Transition Softness takes 0 to 1 in scripting; the panel shows percent. Reported correctly.
- Threshold: Level (`ADBE Threshold2-0001`) takes 0 to 1 in scripting, not 0 to 255 as in the panel, but After Effects reports -30000 to 30000. A level written on the panel's scale renders pure black. Protected by its entry in `AE.KNOWN_EFFECT_SCALES`.
- Glow: Glow Threshold takes 0 to 255 in scripting (default 153), reported correctly, while its `unitsText` says "percent". Glow Radius takes 0 to 1000, Glow Intensity 0 to 255, Glow Based On 1 to 2.
- Keylight (1.2): Screen Gain 0 to 5000, Clip Black and Clip White 0 to 100, Screen Shrink/Grow -5000 to 5000, View 1 to 11 (no item names exposed). Screen Colour reports about plus or minus 3.9 million, an untrusted range.

## House library integration

The optional `house-jsx` and `joeb-motion-jsx` are real extracted pipeline code. They require a MASTER composition with the documented JoeB rig, correct fonts, media and AES_HOUSE_CONFIG paths. They are not a blank-project template. Use `motion-jsx` for independent scenes. Read `joeb-preset` before selecting these helpers.

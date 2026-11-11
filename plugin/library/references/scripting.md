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

## Failures, rollback and script files

Observed in After Effects 2027 (27.0) on 2026-11-10: a script that throws part-way leaves what it already changed applied, as one undo step; a call that changes nothing leaves no undo step at all, so an undo after it reverts the user's previous action; and an undo once raised an After Effects error box that blocked all scripting until a person clicked it.

What the plugin does about it:

- A call that changes the project and throws is rolled back before the error is returned. Inside the call's still-open undo group the plugin adds a marker folder (`mcp-rollback-<request id>`), closes the group, and undoes once with dialogs suppressed. The marker makes the step certain to be the call's own, so the user's previous action is never reverted. It never retries.
- `details.rollback` says what happened: `rolledBack` (true only when the undo ran without throwing and the checks pass), `verified` (`signature`: the marker is gone and every item matches its id, name and layer count from before the call; `partial`: the same over the first 1000 items and the count; `marker`: only the marker could be checked), `reason`, `left` (what is still applied when it did not work), and `aeErrors` (anything After Effects reported during the undo). The item check does not see property values, but the marker being gone means the whole group was undone, because a group is one undo step.
- When `rolledBack` is false, inspect before doing anything else. If the undo did not take effect, the call's changes and the marker folder are still there as one undo step.
- After a rollback, Redo would replay the failed call, marker included. Do not redo it, and do not undo again for it.
- Read-only calls, and calls that run outside the undo group (undo, redo, project open and new), are never rolled back. A script that returns `{ ok: false }` has not thrown and is not rolled back: throw when you want the call reverted.
- `eval.run` and `batch.run` take `rollback: false` for deliberately incremental work whose partial result should stay. `batch.run` with `stopOnError` rolls back the whole batch when a child fails and still returns every child's result; with `rollback: false` its `kept` field names the operations that stayed. Without `stopOnError` nothing is rolled back and the other children's changes stand.
- `project.undo`, `project.redo` and `command.execute` 16/2035 run with dialogs suppressed and report errors After Effects raised in `aeErrors` and `warning`. An undo that throws stops the loop and fails the call.

Script files: `eval.run` takes `file`, an absolute path to a UTF-8 script of at most 1 MiB, instead of `code`. It is checked and read before After Effects is contacted (it must exist, be a file, be readable, not be empty or binary, and not sit inside the plugin's mailbox). Pass data as `args` (any JSON value); the script reads it as `args`, inline code too. The same helpers, undo group and rollback apply. Errors name the line in your code (`(line 3 of your code)`) or the file and line (`(/path/build.jsx:12)`), not a line of the plugin's wrapper.

A timeout after the request was picked up means the script was running in After Effects when the call gave up. The most likely cause is a modal dialog (an error box the script raised, or a warning), which blocks all scripting until a person clicks it, and `instance.dialogs` may not list it. Look at the After Effects window, do not resend the request, and inspect the project once After Effects answers again. When the script finally finishes, the plugin removes the busy lock and any empty temp response that request left, either as soon as the late response arrives or when the next request starts.

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

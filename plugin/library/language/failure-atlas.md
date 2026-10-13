# Failures that shaped the language

These are practical diagnoses from actual motion production and plugin validation. Use the symptom → cause → correction mapping during review. Historical Content cases are mapped in `source-map.json`; newer validation cases are recorded in dated quality reports. Historical quotes, business data and user media are not needed to apply the lessons.

| Symptom | What went wrong | Correction and evidence to inspect |
|---|---|---|
| A polished slide deck instead of motion graphics | Finished generic pictures entered, then parked | Design construction, action, consequence and hand-off; inspect a whole section at speed |
| Better easing still looks cheap | Artwork remained an outlined stand-in for a material object | Fix asset design/viewpoint/light as well as choreography |
| A generated video is visually rich but uncontrollable | Precise changes were baked into the clip | Keep exact type, UI, object relationships and motion native; use prepared assets for material |
| One impressive hero, weak ordinary scenes | Effort was concentrated in the showcase moment | Test a routine evidence beat and transition before scaling production |
| Repeated boxes explain unrelated sentences | The same kit prop replaced literal visual ideas | Give each sentence an acting picture inside a coherent analogy world |
| Camera feels jerky | Word-by-word stop-start keys | One purposeful longer move per transition; preserve reading holds |
| Camera push clips type | Static auto-fit ignored camera bounds | Test the widest line through maximum zoom and clamp/recompose the camera |
| One-frame ghost at scene change | Visibility and camera jump were not frame-exact | Quantize the seam, account for shutter sampling, inspect f-2…f+2 |
| Blank/black ground in export | Comp background was mistaken for a rendered layer | Add a real background with adequate overscan |
| Image pop changes the intended size | Helper reset scale to 100 instead of the asset's resting scale | Animate multiples of the measured base scale |
| Child jumps or grows after parenting | Parenting at the wrong current time preserves the wrong world transform | Parent at rest and set local transforms intentionally |
| A null moves but the visual stack is wrong | Parenting was mistaken for layer order | Move child layers explicitly; inspect occlusion in rendered frames |
| Source and destination show duplicate text | End state was visible underneath the traveling copy | Hide one copy until a matched registration hand-off |
| Multiply still leaves a pale rectangle | Transparent precomp had no intended backing surface | Inspect alpha and backing inside the precomp, then composite on the real ground |
| Foreground object looks pasted on a container | Front rim never occluded the emerging content | Use rear body and masked front faces around the moving object |
| A line lands in the wrong place | Shape path coordinates and layer position were both offset | Choose local or comp coordinates and set the shape transform accordingly |
| A traced guide meets an image at its endpoints but bows away in the middle | The path was drawn from a plausible silhouette instead of measured source geometry | Sample the source feature along its length, map those points through the image layer's scale and position, then inspect dense rendered overlap frames before approving the hand-off |
| Property operations fail after adding a sibling | Indexed property handle was invalidated | Re-fetch the property by stable path after additions |
| A skipped or old layer stays visible | Creation happened before a continue; layer span was never set | Remove skipped creations and check in/out points on every owned layer |
| Later setup extends every caption to the end | Blanket duration reset affected scene/caption layers | Scope setup to base rig layers and preserve content spans |
| Imported footage shows yesterday's pixels | Source cache retained a reused filename | Use a new versioned file or explicitly reload and verify |
| A clip's entrance drifts after offsetting it | startTime moved animation keys along with media | Separate media timing with a precomp/time remap or rebuild key times |
| UI is technically present but unreadable | Entire desktop was squeezed into a small card | Crop to relevant controls and measure text at final output size |
| Light background reveals key residue | Dark preview hid matte defects | Inspect edges on the actual delivery ground; remeasure screen/spill |
| “Library asset” differs from the brief | Decision relied on catalog prose | Open/render the asset before naming it |
| Review export shows no recent edits | Build failed or connection dropped; stale project was rendered | Read back created IDs/counts and verify expected state before export |
| Patching does not approach the reference | Each note was treated as a local effect request | Re-measure reference, rewrite visual operations, rebuild a representative passage |

## Rejected shortcuts

Layer count, key count, a dense event schedule, an error-free build and a successful export are not independent evidence of taste. A still cannot establish camera rhythm or audio sync. An approval of one scene does not approve an entire production or publication. Keep those distinctions in the handoff.

## Script stops on spatial tangents

A visually 2D layer can expose a three-component Position property. A hardcoded two-value tangent then throws midway through an additive build. Gate spatial methods explicitly on TwoD_SPATIAL/ThreeD_SPATIAL (isSpatial alone proved insufficient in this host test), then inspect `prop.value.length` and create a zero vector of that length; spatial temporal easing still uses one ease object. Retain the partial comp identity, inspect it, and remove only confirmed owned work before retrying. This was reproduced in local AE 26.5 testing of a fresh-context generated script.

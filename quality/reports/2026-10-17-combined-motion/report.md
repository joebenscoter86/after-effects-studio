# AFT-46 — combined typography and collage

## Result

MS-07 and MS-08 passed the native composition and scoped-revision checks in Adobe After Effects 26.5x89. The fresh project contains one 1080×1920, 30 fps, eight-second River Day scene, a separate unrelated sentinel composition and an unrelated sentinel layer in the scene. The first version combines native editable type and five native editable paper pieces. The revision changes the exact headline to “Every block can help / the river breathe,” changes the palette from cool blue/coral to warm sand/brick/dark indigo, slows paper arrivals and removes the sampled paper rotation. The longer two-line headline fit at 89.58 px inside an 850×300 source-space box; full-size final frames show complete, readable copy.

The rendered output is visually coherent at start, assembly, and landing. The headline leads; three cut-paper pieces join around one river stroke; the support line and time appear after the assembly. The new palette and slower paper movement are visible without introducing text jitter. This is a technical/agent visual pass of the combined fixture, not Joe's creative acceptance of this particular River Day design. Joe's separate approval of the full paper-collage MS-06 example is recorded in `quality/reports/2026-10-17-collage-acceptance/report.md`.

## Ownership and preservation

- Initial state: fresh empty project, then fixture-created item IDs 1 (sentinel comp) and 14 (owned main comp). Main sentinel layer ID 29 and separate sentinel text ID 13. Owned paper/river IDs 30–35 and text IDs 36–38. The fixture loads helpers and mutates only when `build()` or `revise()` is explicitly called.
- `before.json` was captured before the revision. The baseline was saved, then Save As created the revision project. `revise()` checks the exact owned project filename, composition identity, layer count and owned layer IDs/names before changing properties. It did not create duplicate scene fragments: four project items and 11 main-comp layers before and after.
- `after.json` shows the sentinel comp's structure exactly unchanged. The sentinel layers retain IDs, names, source text, enabled state, transforms, effects and other serialized fields. Exact JSON differs only in default text fill components changing from `0.92156898975372` to `0.92156994342804` when the baseline AEP was saved/reopened, a maximum per-component difference below `0.000001`. Recursive comparison with absolute numeric tolerance `1e-5` found zero other sentinel differences. No sentinel property was targeted by the revision.
- First revision attempt stopped on an overly strict expected-expression prefix after partial owned changes. Because the AE operation is not transactional, the saved owned revision AEP was reopened without saving, the guard corrected, and the revision run again. The successful run passed. This failure is preserved here rather than counted as an initial pass.

## Media and verification

Ignored native/media artifacts are under `quality/renders/2026-10-17-combined-motion/`. The baseline and revision AEPs, seven-frame contact sheets and the two MP4s were inspected. QuickTime playback of the revision advanced from 00:00 to 00:08 at normal speed; sampled rendered frames provided the visual inspection. Each H.264 MP4 is 1080×1920, 30 fps, eight seconds, 240 decoded frames; both passed full `ffmpeg -v error -i <movie> -f null -` decode with no errors. No audio was specified.

| Artifact | SHA-256 |
|---|---|
| `river-day-baseline.aep` | `969de8046b7012978b161280dbb13261f596518456e26043b47277723e38477b` |
| `river-day-revision.aep` | `c4ca586fb2af30a7b13e56be132e26d9f1d6a084ff4abce92c23fa7d7fb0aedf` |
| `baseline.mp4` | `5c075d03b7f9afc8682b8d6651197ce70b55a2cc9c77e1f5c974a0cf2f5b7f62` |
| `revision.mp4` | `a1f0143d3749751a4d4ff9e4790b01fba2b72480c4b9542f1f679d05ee17833a` |

Validation: `node plugin/scripts/manifest.mjs` indexed 29 documents; `node plugin/tests/library-modules.mjs --plugin-root plugin` passed; `npm --prefix plugin/runtime test -- tests/library.test.ts tests/library-modules.test.ts tests/typography.test.ts tests/paper-collage.test.ts` passed 99/99. The new eval cases 10–14 cover combined routing, revision/sentinel preservation, typography-only, collage-only and explicit user override of brand defaults. They are defined but have not been run as independent agent traces; AFT-47's frozen comparative evaluation is the next evaluation gate. The router skill now states one scene owner, both specialists for animated paper typography, negative routing boundaries, and user direction precedence. The module catalog records symmetric compatibility, based on the native combined fixture. Paper-collage visual status reflects Joe's approved MS-06 clip, not approval of this River Day fixture.

No expanded-plugin package was built in this ticket; candidate package hash and installed-context proof belong to AFT-48. No stable release, tag, directory submission or unrelated project was changed.

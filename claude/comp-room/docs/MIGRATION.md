# Motion language migration

The initial plugin provided a condensed library and optional JoeB styling. This revision makes the detailed repo-derived craft language the default. Branding remains configurable; reasoning, timing, reference study, failure corrections and review travel with the plugin.

| Inspected source | Included knowledge | Packaged destination |
|---|---|---|
| Motion playbook §1,4,6,7,11,12 | Operations, progressive construction, measured ease/stagger/spring/whip, stable anchor, reference method, rejected approaches | motion-language, construction, reference-study, failure-atlas, worked-scenes |
| Motion playbook §2,3 | Exact palette/type/stage/captions/modes, no grain | Optional joeb-preset; general principles in type-evidence and assets-depth |
| Motion playbook §5 | Prepared objects, separate parts, blank screens, shared geometry, native exact text | assets-depth, worked-scenes |
| Motion playbook §8–10 | Word anchors, parenting/coordinate/property pitfalls, section builds, checks, brief | scripting, production-workflow, quality, brief-template |
| Motion playbook §13 | Unverified aspects | Preserved as limits; no implied validation of sound or every format |
| VO format §4–6 | Acting picture per idea, coherent analogy, continuity, deliberate camera, exact traversal, relative scale | motion-language, camera-continuity, worked-scenes |
| VO format §2–3,7–9 | Dimensional art, preparation, readable layouts, geometry, occlusion, pitfalls | assets-depth, camera-continuity, type-evidence, failure-atlas |
| VO format §12–14 | Failure progression, rebrief rather than patch, rhythm, fewer/larger objects | failure-atlas, reference-study, brief-template |
| Star workflow brief/beat-loop/library | Recurring star, asset inspection, bounded review, accepted recipes | production-workflow, motion-language, assets-depth |
| Production LEARNINGS | Parenting at rest, timing, asset mismatch, tiny UI, matte residue, stale/skipped layers | failure-atlas, type-evidence, scripting |
| House-polish b02/b03 | Actual multi-event sequences and timings | worked-scenes A/B; motion-jsx |
| CONNECT v9 WHY-THIS-WORKED | Stable real object, middle pose, exact landing, critique of native results | worked-scenes C, motion-language |
| 66-project mining FINDINGS | Numerical observations and sampling caveats | construction, reference-study, timing |

`library/source-map.json` records repo-relative source names and hashes as provenance, not runtime imports. All required teaching documents ship in this plugin. Current routing was checked: retired renderer mandates, old caption grammar and conflicting grain defaults do not become universal rules.

Personal footage, private communications, paid media packs, external reference videos, LUTs and font binaries are excluded. Repo posting/funnel/writing-room procedures are outside this motion plugin. Original example palettes are optional. Host prerequisites and Adobe limitations still apply.

This is a detailed portable migration, not a verbatim copy of the whole Content repository. Future repo changes do not sync automatically: reconcile this source map and rerun cold-start evaluation when updating the plugin.

## Style library import (2026-11-08)

`scripts/import-styles.mjs --from <Content>/production/styles` copies the proven style packages that need no generated art (30 on 2026-11-08: 16 native, 8 print, 2 painterly, 4 3D) into `library/styles/<id>/`, writes `library/styles/index.json` and generates `skills/visual-styles/SKILL.md`. Excluded: the 14 styles that need generated pieces, the `joeb-house` look (it needs Joe's rig), and the two blocked creator studies. Per style it ships `STYLE.md`, the ES3 module and the tools the module's recipe uses; font binaries, font licenses for unshipped fonts, proofs, `style.json` and per-style license copies stay behind.

The importer applies its adaptations every time it runs, so the imported copies are never edited by hand. General rules rewrite Content proof-harness notes into plugin guidance, Content cache folders into "the folder you pass as `--cache`", and the local upstream clone path into the public Lemo-Opuscar URL. Exact edits replace harness and bridge gotchas in `backrooms`, `blueprint`, `lowpoly-island`, `paper-lantern`, `whiteboard`, `glass-product` and `silkscreen-poster`, and make `glass_scene.py` require `clip=` instead of defaulting to a file on the author's machine. If an expected original line is missing, the import stops so the change can be reviewed.

The modules' `buildScene(comp, scene, opts)` builds Content's seven-beat test scene; its scene files and media are not shipped, so the modules serve as worked examples of each technique. The four 3D styles render plates with Blender. Content's proof status travels in the index as `contentStatus` and `contentProof`; plugin-route evidence is recorded separately.


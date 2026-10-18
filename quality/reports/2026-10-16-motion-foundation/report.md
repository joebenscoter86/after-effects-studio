# AFT-39 — portable foundation refresh

Status: scoped foundation implementation and smoke complete. Full-speed perceptual review remains explicitly unperformed. Baseline AFT-38 is committed at ed12236 before these edits.

Refreshed the always-loaded core, workflow, brief, continuity mechanisms, native construction checks, typography measurement/fallback guidance and failure atlas. Existing 19 document IDs and native recovery guidance remain. Core shrank from 901 to 842 whitespace-delimited words; supporting material grew to make mechanism choice and native pitfalls explicit. See word-counts.json. No unavailable specialist skills are advertised.

Source: pinned Content commit 4e6de54f11b3ca9ffa7f2f55b9cdac62a31095c7, motion playbook §§1,4,4a,6,8–11. Live Content now has a later style-package pointer; it was inspected as a delta but not ported. Guidance uses original prose and general concepts, with no onetake code/films, purchased template code, private assets or fonts copied. Local baseline observations supply additional review examples. source-map.json records both routes.

Validation: node plugin/scripts/manifest.mjs regenerated all 19 document hashes. npm --prefix plugin/runtime test -- tests/library.test.ts passed 3 tests after exposing the canonical checkout's existing development node_modules through an local worktree symlink excluded from staging; no packages installed or global settings changed. Initial test invocation failed because the isolated checkout had no vitest. git diff --check passed before final validation. No runtime code or manifest script behavior changed.

The native smoke uses the released runtime/package with only the refreshed library overlaid, in a fresh isolated CLI context. It reuses exact MS-02 copy/palette/spec and normal-model settings. This is an implementation smoke, not a replacement for the later 16 matched candidate evaluations. Native evidence and unperformed checks are recorded below.

## Native outcome

Isolated gpt-6-astra/high smoke completed in 752.29 seconds with 68 observed tool starts. Thirty-nine editable layers, 132 keys, no enabled expressions, exact copy and installed non-substitute Baskerville/Avenir Next faces. The movie is 1920×1080, 30 fps, 12 seconds, 360 frames, video-only; independent full decode and recorded artifact hashes pass. Controller reviewed the delivered-movie sheet and accepted scoped hierarchy/continuity; see controller-review.md and controller-verification.json. No user acceptance or candidate superiority claimed.

Preserved failures: a launcher used a relative plugin path and failed before connecting to AE; absolute path retry inspected/reset only the exact saved clean baseline project. The trial's locked-background inPoint error left partial revision state; it inspected and completed only unfinished changes. A decoder filter quoting error was corrected. ffplay could not initialize a display; full-speed rhythm remains unperformed.

Changed paths: seven guidance/brief documents, source-map.json and regenerated manifest.json. The imported failure-atlas spatial-tangent recovery note was preserved from the preexisting workspace, not authored by this change. The manifest generator needed no logic change. All nineteen document IDs remain readable. Next: AFT-40 validated module catalog.

Final controller context: saved clean owned scene.aep, four project items, MS02 • A little water composition. No unrelated project was modified.

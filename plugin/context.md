# Plugin engineering and motion library

This room contains the complete installable package. Preserve its internal relative paths so runtime, JSX and library resources remain portable.

For engineering: read docs/ARCHITECTURE.md and README.md, inspect only relevant source/tests, define the expected behavior, implement, run appropriate checks, then record the result. Native project operations require live state inspection. Upstream code and notices remain attributed.

For craft: read skills/motion-studio/SKILL.md, then library/language/core.md, library/language/production-workflow.md and library/templates/brief.md. Load technique modules for the actual task. Evolve the packaged library here; source-map paths document provenance and never become imports from the Content repo. Regenerate library/manifest.json with scripts/manifest.mjs after intentional library changes.

Use Plugin Creator for package/install/manifest work and Skill Creator for skill design or evaluations. The three local skills belong to skills/motion-studio/, skills/ae-control/ and skills/motion-review/. The native bridge is declared by .mcp.json. Other asset tools are optional and provider-dependent.

Keep canonical skill prompts in evals/evals.json; place execution evidence in ../quality/. Existing verification/ records are historical evidence, not automatic approval of a new change. Skip product/release writing unless it affects the behavior being implemented.

The repository's approved package directory is plugin/ while its manifest identifier is after-effects-studio. When producing a distributable folder, use the manifest name. Update installed caches through the supported Plugin Creator flow; do not hand-edit marketplace configuration.

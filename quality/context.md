# Quality workspace

Use this room to prove user-visible behavior, craft quality and recoverability.

Read release-criteria.md, [the scenario matrix](fixtures/scenarios.md), the relevant scenario and the local motion-review/ae-control skills. Use [report-template.md](reports/report-template.md) for new runs. Canonical authoring prompts live in ../plugin/evals/evals.json. fixtures/ holds small permitted inputs; reports/ holds dated results, corrections and evidence pointers; renders/ holds ignored native projects and media.

Use ../product/prd.md for requirement IDs, ../product/release-execution-plan.md (D-013) and the current Linear description for remaining acceptance checks, and ../product/backlog.md for identifier mapping. AFT-9 uses controlled test-only response failure with real native-state inspection; do not wait for a spontaneous timeout. AFT-18 proceeds independently; AFT-33 adds lifecycle checks and AFT-34 proves real public Git installation. Attach dated evidence to the corresponding Linear issue; a completed planning document is not a release-criteria pass.

Process: define expected behavior, capture the exact package/version and host, execute in a controlled owned scope, inspect output, record failures, correct the smallest relevant cause, and repeat affected checks. A script return, authoring checklist, sampled still and full-speed playback prove different things. State what was actually checked.

Only one agent/controller operates AE. Inspect its current project first. Preserve unrelated work; identify every test comp and asset before cleanup. Never blindly rerun a timed-out write. Do not save, close or switch the user's project as part of routine tests.

Use motion-review for visual evaluation and ae-control for native operations. Keep human taste acceptance separate from technical validity. Skip release/marketing text and unrelated library chapters. Summaries imported from the prototype remain dated historical evidence; do not relabel them as new-machine tests.

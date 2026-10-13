# After Effects Studio — project map

## Identity and decisions

A free-at-launch plugin that creates and revises editable motion graphics in local Adobe After Effects. Its foundation is Joe Benscoter's production-derived motion language, adapted to the user's subject and visual style. Native AE control executes that direction. The target is a full public v1. Monetization is deferred; free use does not decide redistribution licensing.

This repository is the canonical development workspace. Read this map first, then only the context and relevant files for the task. AGENTS.md is the source of truth; CLAUDE.md points here. Keep routing documents in plain English. Do not require the original Content repository, a personal MASTER rig or the optional JoeB appearance for ordinary use.

## Workspaces

- product/: context.md, brief.md, prd.md, roadmap.md, build-plan.md, backlog.md and decisions.md. Scope, requirements, staged execution, ticket mapping and decisions.
- plugin/: context.md and the complete installable package. The existing .codex-plugin/ and .mcp.json identify the plugin; runtime/ contains src/, jsx/, tests/, fixtures/, docs/, scripts/ and dist/. library/ contains language/, references/, recipes/, examples/, templates/, scripts/ and presets/, plus its manifest and source map. skills/ contains motion-studio/, ae-control/ and motion-review/. scripts/, tests/, evals/, examples/, assets/, docs/ and verification/ support packaging and evidence. README.md, PROVENANCE.md and THIRD-PARTY-NOTICES.txt describe requirements and attribution.
- quality/: context.md, release-criteria.md, fixtures/, reports/ and renders/. Reproducible scenarios and inspected evidence. The canonical skill test prompts remain in plugin/evals/.
- release/: context.md, release-plan.md, listing-draft.md, submission/, website/ and packages/. Public distribution and launch materials.
- README.md explains getting started. .gitignore excludes local secrets, dependencies and large generated output. CLAUDE.md is a pointer only.
- .agents/plugins/marketplace.json is the source-repository Codex marketplace catalog for the planned Git-backed route. It points at plugin/ and does not make the repository public.

## Routing

| Task | Read first | Skip by default | Skills |
|---|---|---|---|
| Define scope or priorities | product/context.md, product/prd.md, product/decisions.md | Runtime and renders | None required |
| Select or track build work | product/roadmap.md, product/build-plan.md, product/backlog.md | Unrelated runtime and raw renders | Linear when connected |
| Build or fix the plugin | plugin/context.md, plugin/docs/ARCHITECTURE.md, relevant source/tests | Launch drafts and unrelated library modules | Plugin Creator for packaging |
| Improve motion knowledge | plugin/context.md, relevant library module, plugin/evals/evals.json | Unrelated runtime code | Skill Creator; local plugin/skills/motion-studio/SKILL.md |
| Test motion or reliability | quality/context.md, quality/release-criteria.md, relevant scenario | Marketing drafts | Local plugin/skills/motion-review/SKILL.md and plugin/skills/ae-control/SKILL.md |
| Prepare a public release | release/context.md, release/release-plan.md, verified quality reports | Unrelated implementation | Plugin Creator |
| Audit this workspace | AGENTS.md and the four context.md files | Render contents | Workspace Architect |

External skills are development aids, not end-user dependencies. Resolve their installed SKILL.md when needed. Do not load every skill at startup.

## Naming and storage

New human-authored files use lowercase hyphenated names. Use YYYY-MM-DD-topic for chronological runs, and -v1/-v2 for creative iterations. Preserve existing code, upstream test, manifest and historical artifact names. Product decisions have stable D-001-style identifiers inside decisions.md. Each quality run gets its own dated folder. Keep new heavy AE projects, media and video renders in quality/renders/; keep distributable archives in release/packages/. Those outputs are ignored by Git; tracked reports name evidence and describe what was actually inspected. Empty scaffold leaves use .gitkeep.

## Working boundaries

The bundled library is the single maintained motion source for this product. Source paths in its provenance are historical references, not dependencies. Update the library manifest after intentional edits. Preserve upstream and third-party notices. Do not silently choose an open-source license, publish a repository or submit a listing merely while preparing a release.

Inspect the exact current AE project before native writes. Only one controller operates AE at a time. Never clear, close or replace unrelated work to run a test. On uncertain completion, inspect before retrying; clean up only verified owned test items. Runtime success, visual judgment and user acceptance are distinct. Record failed checks and platform limitations honestly.

## Where to resume

Read product/release-execution-plan.md for the detailed D-013 plan approved 2026-10-13, then the current Linear ticket. product/roadmap.md retains evidence context; product/build-plan.md defines six stages; product/backlog.md maps the baseline and follow-up tickets. Linear owns live execution status. Recovery, separate-Mac installation, source/rights review, page preparation and lifecycle tests can proceed independently. AFT-32 publishes reviewed infrastructure only after authorization; AFT-34 rehearses real public-Git installation before AFT-23 freezes the Codex candidate. AFT-24/AFT-25 handle Codex launch; AFT-30/AFT-35/AFT-36 handle the separate nonblocking directory path. Scaffold and planning completion do not close release requirements.

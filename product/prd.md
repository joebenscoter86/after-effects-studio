# Public v1 requirements

Status: implementation baseline drafted on 2026-10-06 and updated for D-006 through D-008. Public Codex distribution, the initial macOS/AE 2026 host scope and original-material license policy are chosen; exact tested versions and publication remain open. This document defines what to build; it does not certify release readiness.

## Problem and intended user

Creators and small creative teams need to turn plain-language direction into useful motion graphics, revise them deliberately, and keep editable After Effects work. Tool access alone does not solve composition, choreography, continuity or rendered review. The product combines native local control with the bundled production-derived motion language.

The user's subject, assets and brand determine the appearance. Ordinary use must work without the private Content repository, Joe's fonts, a personal MASTER rig or a paid asset-generation service. Adobe After Effects and a compatible agent host remain prerequisites.

## First-session journey

1. Install the plugin through the documented supported route and identify prerequisites.
2. Check the runtime, find AE and explain any permission or connection problem.
3. Inspect the exact current project and agree the scope of work before native writes.
4. Describe a scene; resolve only missing creative information that materially affects the result.
5. Build editable native work, render a preview and inspect it.
6. Make a meaningful revision while preserving approved and unrelated material.
7. Deliver an editable AEP with its required assets and a playable movie; explain any remaining limitation.

## Required outcomes

All requirements below are launch requirements within the eventual declared platform scope. Quality is measured through the evidence in [release criteria](../quality/release-criteria.md), not through runtime test counts alone.

| ID | Requirement | Acceptance evidence | Backlog |
|---|---|---|---|
| R-01 | Supported installation and discovery | Documented install works outside this repo; prerequisites and nonstandard AE paths are handled; a genuinely clean second machine reaches first use | B-04–B-08, B-18 |
| R-02 | Native creation and preview | A plain-language brief produces editable native layers and an inspected preview, with project ownership recorded before writes | B-07, B-10, B-14–B-16 |
| R-03 | Deliberate revision | Copy, palette, pacing and framing changes are covered across before/after cases; approved material persists and repeated requests do not leave duplicate scene fragments | B-11, B-14–B-16 |
| R-04 | Preservation and recovery | Blank/existing/unsaved project cases, closed/busy AE, denied permission, absent font/media and uncertain completion have verified safe outcomes; inspection precedes retry | B-08–B-10, B-13 |
| R-05 | Portable motion craft | Fresh sessions use only packaged guidance for materially different looks; required foundations and relevant techniques are read; personal rig/assets remain optional; a harder brief probes practical limits | B-14–B-17, B-27 |
| R-06 | Finished visual outcomes | Type-led identity, causal explainer and original-art concept product sequence each include an ordinary beat, difficult transition, meaningful revision and actual full-speed review; a separate ambitious capability probe documents its result and limits | B-14–B-17, B-27 |
| R-07 | Editable and playable delivery | Delivered AEP reopens, assets resolve, native structure is editable, full movie decodes, metadata matches the brief and delivered copies match hashes | B-12, B-14–B-16 |
| R-08 | Reproducible public package | Candidate validates with its manifest/library/notices; artifact hash, source revision and rebuild procedure are recorded; no secrets, private media or developer dependencies ship | B-19, B-21, B-23 |
| R-09 | Accurate distribution and support | Local-controller route is confirmed; platform claims have evidence; publisher, support, data-flow/privacy/terms and listing materials are accurate and available for the chosen route | B-03, B-04, B-20, B-22–B-25 |

## Scope boundaries

Included: native creation/revision, the complete portable craft foundation, guided setup, actionable recovery, rendered review, three verified complete examples and a separate harder capability probe. Launch is free under D-003.

Deferred: billing, subscriptions, license-key enforcement, paid feature tiers, a required AE panel, hosted rendering, and mandatory external media generation. A cloud relay or account/device-pairing system is not planned unless directory review establishes a need and Joe chooses that architecture. Windows, older AE releases and other hosts require new evidence and a scope decision.

This is an agent-host plugin using local AE scripting. It does not promise arbitrary proprietary effect UI control, universal media compatibility or guaranteed one-shot creative quality. Optional JoeB appearance remains separate from the universal craft workflow.

## Technical and operating constraints

- Keep the installable package self-contained under plugin/. Its current bundled Node server uses local scripting/file IPC, without a hosted listener.
- Node 24+ is the current declared prerequisite. The existing native evidence is macOS/AE 26.5; that is an evidence boundary, not a completed compatibility certification.
- Inspect the exact open project before mutation. One controller operates AE at a time. Uncertain writes require inspection before retry, and undo groups do not imply rollback.
- Preserve upstream attribution and bundled-library hashes. Historical source-map paths must never become runtime dependencies.
- Record runtime execution, visual review and Joe's creative acceptance separately.

## Success and measurement

Release passes only when every launch requirement has an evidence link and every advertised platform combination has installation, creation, revision and export evidence. Record elapsed time, manual interventions, errors and recovery in the clean-install run to establish a baseline; no unsupported time-to-first-scene target is imposed yet.

Every demo must satisfy the same delivery checks, rather than relying on one successful sample frame. Requirements may be narrowed only by an explicit decision, not by marking an unavailable check passed.

## Decisions and external inputs

| Input | Why it matters | Owner / tracking |
|---|---|---|
| Public Codex install details | Git-backed route chosen in D-006; exact source/command still needs validation | B-22 and B-18 |
| Exact release versions | Mac/Codex desktop/AE 2026 scope chosen in D-007; advertise only tested builds | B-18 and B-23 |
| One separate test machine | Required to prove the candidate installs beyond the development Mac; Joe may operate it | Joe supplies access, B-18 |
| Original-material redistribution terms | D-008 permits free creator and commercial-output use while reserving standalone repackaging/resale | Chosen; legal/asset release review remains |
| Publisher, final name, support/domain ownership | Required for truthful release metadata and public pages | Joe, B-20 |
| Product artwork | Joe chose a Higgsfield-generated fictional concept as the fixed input; provenance, reuse terms and creative acceptance still need to be recorded | B-16 |

See [build plan](build-plan.md) for sequencing and [backlog](backlog.md) for execution. [Decisions](decisions.md) remains the only authoritative record of settled product choices.

# Public v1 support matrix

Prepared 2026-10-06 for AFT-4 and chosen in D-007. This is the intended scope, not an advertised compatibility claim. Each advertised combination needs full acceptance evidence on the exact candidate.

## Chosen initial scope

Start with Codex desktop running locally on macOS with a licensed After Effects 2026 installation and Node.js 24+. Record the exact Codex, macOS, AE and Node builds that pass the release candidate, and publish those tested builds in the support page. The current development Mac is macOS 26.6.2, Node v25.9.0 and AE 26.5.0.89 installed. The older native proof was on macOS 26.4 / AE 26.5x89. These are development observations, not complete end-to-end v1 qualification.

| Environment | Current status | Gate before advertising support |
|---|---|---|
| Codex desktop, macOS, AE 2026 | Chosen v1 focus. One developer Mac has native build/sample-frame evidence on macOS 26 / AE 26.5; no clean second-machine or complete movie/AEP delivery evidence | AFT-7/9/12 creation, safe revision and export; AFT-18 install of the exact candidate on one separate Mac; record exact tested versions and any permission prompts |
| Node 24 minimum | Node v24.0.0 passed unpacked-candidate doctor and offline MCP smoke on the development Mac on 2026-10-09; prior development/native work used Node 25.9.0. See [minimum-version report](../reports/2026-10-09-node-24-minimum/report.md). | Run a supported native create/revise/export journey using Node 24 on an eligible machine before claiming complete Node 24 compatibility; AFT-18 remains separate. |
| macOS versions other than the tested build | Not qualified by a successful run on macOS 26.x alone | Repeat the installation, creation, revision and export scenario on each version before adding it to claims |
| AE 2024/2025 or other AE 2026 builds | Default discovery supports these paths, but current product outcome is unverified | Repeat the full acceptance scenario on each version before advertising it |
| Windows | Underlying runtime has Windows code and offline tests, but this package has no local Windows native acceptance evidence | Obtain a Windows machine with AE and test installation, permissions, creation, revision, project preservation, export and support instructions before claiming Windows v1 support |
| ChatGPT cloud or the universal plugin directory | Not covered by the current local Codex install; AFT-3 found directory route unconfirmed | Confirm the supported local-MCP distribution route and complete separate host/reviewer acceptance before claiming availability |

## One-machine release scenario

Use the exact candidate artifact and a genuinely separate Mac with no Content checkout or preconfigured plugin. Joe may operate it. Record the operator and any prior familiarity; an external technical tester is not required. Follow only the user-facing install guide. Confirm Node version, AE build, Codex build, plugin version/hash and macOS build. Capture the permission prompts and whether the instructions identify the next action. Inspect the exact open project before native writes, then create an editable comp, inspect a preview, revise it, reopen the delivered AEP and validate a complete movie. Record all manual intervention and recovery.

This run proves candidate portability on one supported combination. It does not establish compatibility with every macOS patch level, AE release, or host, and a Joe-operated run is not ordinary-creator usability evidence. An observed creator session is useful for improving onboarding but is not required to let implementation continue.

## Scope rule

Under D-007, start with macOS/Codex desktop and AE 2026, disclose only the exact tested builds, and add Windows, other hosts or older AE versions only after their own evidence. Do not turn the upstream runtime badge into an After Effects Studio release promise without those checks.

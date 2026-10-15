# After Effects Studio

One Codex plugin for local After Effects control, motion design guidance, reusable JSX, and visual quality checks. This is a Codex plugin that drives the native application, not a compiled Adobe effect or a required CEP panel.

Use is free for personal and paid client motion work, including delivery of editable AE projects. [`license.md`](license.md) covers Joe's original materials; [`PROVENANCE.md`](PROVENANCE.md), `runtime/LICENSE`, and [`THIRD-PARTY-NOTICES.txt`](THIRD-PARTY-NOTICES.txt) identify separately licensed upstream components.

## Use

For the public pre-release source, follow the [Git marketplace install guide](docs/local-install.md), then start a new task. Ask, for example: “Create an editable six-second product explainer in After Effects. Use precise typography, a restrained palette, and show me a rendered preview.” The plugin supplies three skills and twelve MCP tools, including an offline motion library and the native operation catalog.

For installation, update, removal and restore, see [local installation and update](docs/local-install.md). Then follow [your first motion scene](docs/first-session.md) and [editable project and movie delivery](docs/delivery.md). The public Git source passed a first install and native create/revise/export/reopen journey on a separate Mac on 2026-10-15; the original installer transcript was not captured. Users do not need a Git clone, npm install, source build or manual MCP config edit.

Requires Node.js 24+ and a licensed After Effects installation. The initial product release targets local Codex desktop on macOS with AE 2026. The separate-Mac rehearsal tested macOS 26.6.2, Codex desktop 26.930.61225, CLI 0.144.1, Node 26.5.0 and AE 26.5x89; these are tested builds, not a broad compatibility guarantee. The underlying runtime also has Windows code and AE 2024–2026 discovery paths, which are not product support claims. Run `node scripts/doctor.mjs` to check prerequisites. The report identifies required failures and next steps. A custom install path uses `AE_MCP_EXE`; legacy `AE_EXE` is also recognized. Restart the agent host after changing either variable. `ffmpeg` and `ffprobe` are optional for normal plugin use. The bundled export verifier needs them; a complete decode can also be checked with the operating system's AVFoundation tools and recorded as such. macOS may ask for Automation access; enable AE's “Allow Scripts to Write Files and Access Network” preference when needed.

The doctor checks local files and path discovery; it does not test live AE connectivity or permission grants. For a failed connection, use [connection and permission recovery](docs/connection-recovery.md). It distinguishes an explicit macOS Automation denial from a timeout and requires project inspection before any uncertain write is retried.

The server is bundled: users do not need npm dependencies, a Content checkout, a Higgsfield account, or an AE panel. Generated images and video are optional inputs from separately available tools.

## What runs locally and what access it has

The installed plugin starts its bundled Node MCP server with standard input/output. That server exchanges temporary request and response files with AE and asks the operating system to run AE scripts. It does not start a public web server or require a publisher account. The OS/AE permissions allow the controller to inspect the open project and, when writes are enabled, create, change or delete native items and save AEPs/exports to paths you choose. `eval.run` can run custom AE scripting and is enabled by default; set `AE_MCP_ENABLE_EVAL=0` to remove that capability or `AE_MCP_READONLY=1` to restrict project writes. The per-user mailbox is temporary, but your saved AEPs and exports remain where you put them.

Your instructions, tool inputs/results, project metadata and previews can reach the Codex host as part of the task. Optional asset services have their own data handling. The plugin does not automatically upload the complete AE project to JB Technology LLC. Use [connection recovery](docs/connection-recovery.md) if permissions or AE state prevent a call. Use [local installation and update](docs/local-install.md) for supported removal/restore commands; removing the plugin does not delete your project files. Inspect the exact project before a write, especially after a timeout. The original-material grant, upstream MIT license and dependency notices are linked above so you can inspect the executable source and rights before installing.

## Capabilities

- Inspect projects, comps, layers, properties and installed host capabilities.
- Create and edit native compositions, text, shapes, masks, keyframes, expressions, effects, cameras, lights and footage using the catalog.
- Run custom ExtendScript with `eval.run` for the exposed native scripting API.
- Save projects, use render queue operations, export frames/contact sheets and exchange project JSON within the runtime's documented serialization limits.
- Read 19 bundled documents and code libraries: the motion language, production workflow, construction timing, camera continuity, assets and depth, typography and evidence, reference study, failure atlas, three worked scenes, scene brief, core technical guides, optional JoeB appearance and reusable JSX.

“Full access” means the exposed AE scripting API plus catalog operations, not every proprietary effect dialog or Adobe UI control. Query the catalog and installed effects rather than assuming coverage. This plugin enables custom scripting by default; `AE_MCP_ENABLE_EVAL=0` disables it and `AE_MCP_READONLY=1` restricts project mutations. Treat script inputs as executable code.

## Existing projects

Inspect before writing, preserve unsaved work, and don't run competing controllers against AE. Native runtime clients share their transport coordination, while unrelated CEP/cloud bridges do not. Batches are undo-grouped but do not roll back on failure; a timed-out request may have run. Save/export writes cannot be undone with project undo.

## Motion language for every style

The default skill and server instructions require the bundled motion language, production workflow and brief before creative work. Detailed techniques are loaded for the actual scene. Construction, causal action, state changes, persistent object identity, measured timing and rendered review come from the Content production work and apply to every palette and brand. These are self-contained portable adaptations, not links to a private checkout. See `docs/MIGRATION.md` for source coverage and exclusions. Future repository changes require an explicit plugin update.

## Optional JoeB preset

The production-derived craft workflow is the default. JoeB is a selectable look derived from the 2026-10-06 Content playbook. `library/presets/house.jsx` and `motion.jsx` are the user's existing helper code, with machine-specific asset defaults removed. They require a compatible MASTER rig and configured local media; no footage, proprietary template packs, LUTs, fonts or generated asset kit is bundled. The independent `library/scripts/motion.jsx` works without that rig.

## Development

Source and runtime tests are included. In `runtime/`, run `npm ci --ignore-scripts`; then from the plugin root run `node scripts/build.mjs`. Run `npm run typecheck` and `npx vitest run --exclude 'tests/e2e/**'` in runtime. Do not run upstream E2E suites on an important open project. `node tests/smoke.mjs` checks the shipped MCP without AE; `--live` adds read-only host checks; `--scratch` additionally builds, renders and removes a uniquely named scratch comp in the current project.

After intentional library edits regenerate its hashed index with `node scripts/manifest.mjs`. See `PROVENANCE.md` for source attribution, `docs/ARCHITECTURE.md` for packaging and `verification/RESULTS.md` for actual validation status. Install/reinstall through the plugin-creator workflow so Codex refreshes its cache.

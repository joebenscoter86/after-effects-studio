---
name: ae-control
description: Control local Adobe After Effects through the After Effects Studio MCP. Use for project inspection, compositions, layers, shapes, text, masks, effects, keyframes, expressions, footage, native scripting, saving, and rendering.
---

# Native After Effects control

1. Call `ae_version_info` and `ae_context`. Match the user's project; unsaved/untitled work is real work. Do not switch, save over, or close unrelated projects. Use IDs where names are ambiguous.
2. Call `ae_catalog` then the relevant category to discover exact arguments. Do not reuse legacy `ae_batch` cloud schemas. `ae_do` dispatches native operations and supports `batch.run`.
3. Prefer operations from the catalog. For custom builds, `eval.run` is enabled by this plugin and exposes the native ExtendScript API. Load `scripting` and relevant library code. AE.* runtime helpers are listed in context.
4. One coherent edit per call; inspect between dependent steps. Undo grouping is not a transaction: partial edits survive a failure. A timed-out request may have executed. Inspect before retrying; never blindly replay a creation batch.
5. Never nest beginUndoGroup/endUndoGroup or invoke undo inside `eval.run`. Use project.open/new/undo/redo as dedicated catalog operations outside batches; opening/closing a project inside an undo group corrupts that group.
6. Confirm results with state inspection and rendered frames. Save only to the intended project. Saving and exports write files and are not undone by project undo.

## Portable local setup

The bundled runtime needs Node 24+ and an installed licensed After Effects. Run `node scripts/doctor.mjs` from the plugin root for diagnostics. macOS may prompt to permit Automation; AE must allow scripts to write files. `AE_MCP_EXE` selects a nonstandard AE install; `AE_MCP_READONLY=1` restricts mutations. See `README.md` for startup and limits.

The plugin supports AE's exposed scripting API. Third-party custom UI controls, effect-specific dialogs and Adobe licensing are not bypassed. Query installed effects and fonts; don't invent availability. Some custom values (such as a LUT file picker) require an existing animation preset or user UI action.

Use one controller at a time. The bundled native runtime serializes its own clients; unrelated CEP panels and the older Content shell bridge do not share that lock.

# Local installation and update

This guide records development and pre-release installation paths. The [public Git-backed source](https://github.com/joebenscoter86/after-effects-studio) passed an offline smoke check on the development Mac on 2026-10-13. On 2026-10-15, Joe confirmed a first install on a separate Mac and the installed package passed a full native AE journey. This is pre-release acceptance, not a stable-release claim; the [redacted test report](https://github.com/joebenscoter86/after-effects-studio/issues/1) records the exact candidate and limitations.

## Prerequisites for a creator

- Codex desktop with a plugin source configured by the publisher, Node.js 24+ and a licensed local After Effects installation.
- The plugin package includes its Node server and motion library. Installing npm developer dependencies, building source, cloning Git, and editing `.mcp.json` are not user steps.
- AE access permissions are checked separately from file discovery. Run `node scripts/doctor.mjs` from the installed plugin folder for read-only prerequisite diagnostics; a live read-only connection is still needed to verify macOS Automation and AE scripting-file-access permission.

## Current personal marketplace install

On this development Mac the `personal` marketplace already exposes `after-effects-studio`. Install it in the Codex app's Plugins Directory from Personal, or run:

```text
codex plugin add after-effects-studio@personal
```

The command prints the installed cache path. Start a new Codex task so its skills and MCP tools are loaded from that version. In that task, ask for a read-only AE context check before permitting native writes. If the plugin is absent from Personal, the marketplace source is not configured on that machine; the command alone cannot discover this private source.

## Public pre-release Git source

On a machine with a supported Codex CLI, add this repository and then install its named plugin:

```text
codex plugin marketplace add joebenscoter86/after-effects-studio
codex plugin add after-effects-studio@jb-technology
```

These exact commands installed version `0.1.0+codex.20261011211837` from public commit `13b44b3d72ea6dd00dd6312933504fa383528676` on the development Mac. Joe confirmed the work-Mac run was its first After Effects Studio install; the installed plugin matched that public commit and completed the native first-use test. The test task began after installation, so its report does not preserve the original command output or elapsed install time. After installation, start a new Codex task and request a read-only AE version/project check before any write. Use normal software and AE permission controls; stop if they block the test.

## Refresh from the canonical repository

The maintained source is this repository's `plugin/`; the installed cache is a snapshot and must not be edited as source. The maintainer stages reviewed package bytes in the configured development marketplace, then uses Plugin Creator's cachebuster and reinstall flow. The exact local source path is machine-specific and is not part of the distributed plugin.

Before the cachebuster step, the staged source must contain the intended package bytes. Copy the resulting manifest version back into the canonical repo so the source and installed artifact identify the same build. Validate both package folders with Plugin Creator's `validate_plugin.py`, compare key package hashes, then run the installed offline smoke check from an unrelated working directory. Start a new Codex task after reinstall. The old task may retain a binding to a cache path removed during refresh; an AE “File or folder does not exist” script alert from that stale binding is not evidence that the new package failed. Dismiss that alert, stop using the old binding, and verify the new installed cache from the new task or an isolated MCP client.

If Codex still shows an older version, check `codex plugin list` for the personal source and version, confirm the staged manifest version changed once, reinstall from the same marketplace, and start a new task. Do not alter unrelated marketplace entries or MCP registrations to force a refresh.

## Update, remove and restore a configured installation

These commands operate on a marketplace that is already configured. Replace `MARKETPLACE` with its actual name from `codex plugin marketplace list`; the public repository's marketplace is `jb-technology`. Check the plugin version with `codex plugin list --json` before and after each change.

To update from a local marketplace, obtain the new publisher package in that marketplace first, then run `codex plugin add after-effects-studio@MARKETPLACE` again. For a Git marketplace, run `codex plugin marketplace upgrade MARKETPLACE` before reinstalling. Start a new Codex task after the version changes so it loads the new tools and skills. A task started against an older cache can retain a stale path; do not diagnose that old task as proof that the new installation failed. If the version did not change, inspect the marketplace source and its manifest before retrying.

To remove only this plugin, run `codex plugin remove after-effects-studio@MARKETPLACE`. Start a new task and confirm the plugin is absent from `codex plugin list --json`. Removing the plugin cache does not remove AE project files, exports, user-supplied media or unrelated plugins. Remove the marketplace itself only if you no longer want any plugins from it: `codex plugin marketplace remove MARKETPLACE`. Inspect that marketplace's other entries first.

For rollback, restore a known-good, publisher-provided version of the marketplace/package and run `codex plugin add after-effects-studio@MARKETPLACE` again, then start a new task. The CLI help inspected on 2026-10-13 has no direct `plugin rollback` command or version pin on `plugin add`; retaining the prior package or a known Git ref is therefore necessary. Do not hand-edit an installed cache. The isolated AFT-33 CLI rehearsal verified an older package could be restored after removal, but native AE reopening and project/export preservation still need an owned lifecycle session.

## Public path and remaining release check

The public Git source and two Codex plugin commands are available. The separate-Mac first install and native first-use journey have passed for the candidate named above, with the original installer transcript unavailable. Do not describe this as one-click installation. The creator does not need Git commands or a source build. After the final stable release is published, repeat the public install and advertised journey against its exact released bytes (AFT-25).

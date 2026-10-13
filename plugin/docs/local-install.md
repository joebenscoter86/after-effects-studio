# Local installation and update

This guide records the supported development install. The current marketplace entry is personal to this Mac. D-006 selects a public Git-backed Codex route, but its source and exact user command remain release work; no public install URL exists yet.

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

## Refresh from the canonical repository

The maintained source is this repository's `plugin/`; the installed cache is a snapshot and must not be edited as source. The maintainer stages reviewed package bytes in the configured development marketplace, then uses Plugin Creator's cachebuster and reinstall flow. The exact local source path is machine-specific and is not part of the distributed plugin.

Before the cachebuster step, the staged source must contain the intended package bytes. Copy the resulting manifest version back into the canonical repo so the source and installed artifact identify the same build. Validate both package folders with Plugin Creator's `validate_plugin.py`, compare key package hashes, then run the installed offline smoke check from an unrelated working directory. Start a new Codex task after reinstall. The old task may retain a binding to a cache path removed during refresh; an AE “File or folder does not exist” script alert from that stale binding is not evidence that the new package failed. Dismiss that alert, stop using the old binding, and verify the new installed cache from the new task or an isolated MCP client.

If Codex still shows an older version, check `codex plugin list` for the personal source and version, confirm the staged manifest version changed once, reinstall from the same marketplace, and start a new task. Do not alter unrelated marketplace entries or MCP registrations to force a refresh.

## Update, remove and restore a configured installation

These commands operate on a marketplace that is already configured. Replace `MARKETPLACE` with its actual name from `codex plugin marketplace list`; the public marketplace is planned as `jb-technology` but does not exist yet. Check the plugin version with `codex plugin list --json` before and after each change.

To update from a local marketplace, obtain the new publisher package in that marketplace first, then run `codex plugin add after-effects-studio@MARKETPLACE` again. For a Git marketplace, run `codex plugin marketplace upgrade MARKETPLACE` before reinstalling. Start a new Codex task after the version changes so it loads the new tools and skills. A task started against an older cache can retain a stale path; do not diagnose that old task as proof that the new installation failed. If the version did not change, inspect the marketplace source and its manifest before retrying.

To remove only this plugin, run `codex plugin remove after-effects-studio@MARKETPLACE`. Start a new task and confirm the plugin is absent from `codex plugin list --json`. Removing the plugin cache does not remove AE project files, exports, user-supplied media or unrelated plugins. Remove the marketplace itself only if you no longer want any plugins from it: `codex plugin marketplace remove MARKETPLACE`. Inspect that marketplace's other entries first.

For rollback, restore a known-good, publisher-provided version of the marketplace/package and run `codex plugin add after-effects-studio@MARKETPLACE` again, then start a new task. The CLI help inspected on 2026-10-13 has no direct `plugin rollback` command or version pin on `plugin add`; retaining the prior package or a known Git ref is therefore necessary. Do not hand-edit an installed cache. The isolated AFT-33 CLI rehearsal verified an older package could be restored after removal, but native AE reopening and project/export preservation still need an owned lifecycle session.

## Public path still to prove

OpenAI documents Git-backed marketplaces and a `codex plugin marketplace add` command for adding a source. The selected Codex route still needs a reviewed public source, the exact source address and install steps in the release guide. Test those steps on one clean second Mac, recording every copy/paste command and permission prompt. Do not describe this as one-click installation until that journey is observed. The creator should not need Git commands or a source build; whether the supported host can meet that standard must be verified with the chosen published source.

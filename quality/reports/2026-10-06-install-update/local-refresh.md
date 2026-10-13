# AFT-6 local install and cache refresh

Publication copy: developer home paths were redacted on 2026-10-09; [the redaction manifest](../2026-10-09-public-source-redaction/manifest.json) identifies the original and public file hashes. All other recorded results are unchanged.

Date: 2026-10-06 (America/Los_Angeles). Scope: supported installation/update from the canonical repository into the already configured personal Codex marketplace on this Mac. No native AE connection or project mutation occurred. This is not a clean second-machine or public-Git install test.

## Sources and actions

- Team package source: `<developer-home>/after-effects-studio/plugin/`.
- Existing personal marketplace source: `<developer-home>/plugins/after-effects-studio`; verified that `~/.agents/plugins/marketplace.json` points to it. The old installed cache was version `0.1.0+codex.20261007025134`.
- Validated marketplace name `personal` through Plugin Creator's `read_marketplace_name.py`. Staged the canonical package into the existing source, excluding `runtime/node_modules` and the repo-only `context.md`. Before staging, `diff -qr` showed only the AFT-5 implementation/docs changes plus those excluded files.
- Used Plugin Creator's `update_plugin_cachebuster.py` on the personal source. It changed the manifest version once to `0.1.0+codex.20261007034703`; copied that manifest back into canonical `plugin/` for source/artifact parity. Plugin Creator validation passed for both folders.
- `codex plugin add after-effects-studio@personal` installed the plugin into `<developer-home>/.codex/plugins/cache/personal/after-effects-studio/0.1.0+codex.20261007034703`.

## Verification

- SHA-256 matched across canonical source, staged source and installed cache for the manifest, MCP declaration, start script, doctor and its core, bundled runtime, library manifest and motion-studio skill. The manifest reports the intended new version.
- From `/tmp`, `node <installed>/scripts/doctor.mjs` passed required prerequisites and clearly said live permissions were unchecked.
- From `/tmp`, `node <installed>/tests/smoke.mjs --output <developer-home>/after-effects-studio/quality/reports/local-smoke/aft6-installed` passed MCP handshake, tool discovery, all 19 hashed library resources, craft routing, traversal rejection and offline catalog. The detailed smoke JSON is intentionally ignored as local output.
- `codex plugin list` showed the new version enabled. Other sampled installed plugins (documents, pdf and remotion) remained listed at their previous versions. SHA-256 of personal marketplace JSON and Codex config was unchanged before/after the reinstall.

## User experience boundary

The personal source is preconfigured on this Mac; a new creator cannot run `codex plugin add after-effects-studio@personal` without that source. The [local install guide](../../../plugin/docs/local-install.md) documents the working development path and distinguishes maintainer steps from creator steps. AFT-3 must choose a public route; AFT-22 supplies the real published source address and final instructions. AFT-18 tests those instructions on one genuinely separate machine. No Git expertise or source build should be required of the creator, but public install simplicity has not yet been demonstrated.

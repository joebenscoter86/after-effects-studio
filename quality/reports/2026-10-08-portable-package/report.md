# AFT-17 local payload refresh — 2026-10-08

The corrected three-style guidance is packaged as local candidate `0.1.0+codex.20261008101244`. This archive is not installed in Codex, published, or clean-machine validated. It advances AFT-17's payload verification but does not prove that a fresh agent will follow the craft routing.

- Source checkout base: `e8b58fd58955866a1da7f31d11c9407947a5fc57` with uncommitted work. Host: macOS development Mac; this check did not connect to AE or change its project.
- Archive: `release/packages/after-effects-studio-0.1.0+codex.20261008101244.zip` (Git ignored), 54 installable files. SHA-256 `ec20ebffd4be6de6e7d6104b2d4ab506f476b324974bfc28f919867abe38b06a`; normalized payload SHA-256 `6f8bc7c22fcbb34e65643b43524cfb45eb9a7de535ede97637e9a15125709fa0`. Two independent builds produced the same hashes. [Full file hashes](package-build.json) identify the exact payload.
- The archive builder rejected absolute developer paths, private-key markers and common credential tokens in non-PNG package files, and required the existing license and third-party notice files. This is a package scan, not a legal or security audit.
- An unpacked copy under ignored `quality/renders/2026-10-08-portable-package/unpacked/` was started from `/tmp` with the plugin's smoke test. The MCP handshake, tool discovery, all 19 hashed library reads, default craft route and path-traversal rejection passed. Raw output is in ignored `quality/renders/2026-10-08-portable-package/smoke/smoke-report.json`.
- The versioned archive contains the new failure-atlas registration case and its regenerated manifest hash. The new geometry eval remains in the source `plugin/evals/` development suite; eval prompts are not installable package files.

The earlier installed candidate `0.1.0+codex.20261007203609` remains the one used for AFT-14–AFT-16 native demonstrations. Installing this new archive, starting an independent task and checking actual use of the bundled craft guidance remain separate AFT-17 work. AFT-18 still needs a genuinely separate Mac; this unpacked test is not that acceptance run.

## Prepared AFT-18 transfer kit

The same 54 candidate files were wrapped in a deterministic local marketplace kit: `release/packages/after-effects-studio-clean-test-0.1.0+codex.20261008101244.zip` (Git ignored), current SHA-256 `32a8c59254eed03a7816aaf84e931ecb492ab591fe552d86f7d1ba784e7f8b84`. It contains 57 files: the plugin, `.agents/plugins/marketplace.json`, `candidate.json` with per-file hashes, and the [second-Mac runbook](../../fixtures/clean-machine-runbook.md). The wrapper was rebuilt twice with matching hashes on 2026-10-09 after D-011 excluded the company-managed Mac; the 54 plugin files and source-archive SHA-256 stayed unchanged. The earlier wrapper hash `83627c786f84afcae3e3f6fd23c054d5d01a762743745bf9d43bcef819b7988c` is superseded. All 54 plugin files matched `candidate.json` after the original extraction; the contained plugin passed offline MCP smoke from `/tmp`. [Kit build metadata](clean-test-kit.json) records the current wrapper hash.

The kit is a local test source using the current documented Codex marketplace layout. Its install commands and native journey have **not** been exercised on another Mac. It does not replace the public Git-backed installation gate.

The canonical repository now has a separate [Git marketplace catalog](../../../.agents/plugins/marketplace.json) pointing at `plugin/`, with the proposed public commands documented in [the route draft](../../../release/submission/git-marketplace-route.md). A static check resolved that path to the matching plugin manifest and version. This is source wiring only; the repository and URLs remain unpublished.

For the current source checkout, runtime typechecks passed and the offline Vitest suite reported 409 passed, 109 skipped. The skipped suites include session-mutating and destructive AE cases; none were enabled. The source and unpacked-kit MCP smoke checks passed. These checks do not establish a second-Mac install or fresh-agent visual craft use.

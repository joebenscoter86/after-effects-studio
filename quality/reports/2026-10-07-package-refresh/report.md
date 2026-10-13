# Local package refresh — 2026-10-07

The AFT-12 delivery guide and README link are included in local plugin candidate `0.1.0+codex.20261007202527`. Source HEAD is `e8b58fd58955866a1da7f31d11c9407947a5fc57` plus uncommitted work. This supersedes the local archive cited in the [earlier AFT-21 report](../2026-10-06-release-package/report.md); it is neither published nor clean-machine validated.

- Installed personal-cache tree: 451 files, SHA-256 `04f4288d7e870bb05196d245ab30397dcc602ef7eeea418f5d4104acece21f79` using sorted relative paths with each file hash.
- Reproducible archive: `release/packages/after-effects-studio-0.1.0+codex.20261007202527.zip` (Git ignored); 54 installable files, SHA-256 `70a0ea283994eb60d85ef0872333d24438b76970fa1c1aae7feede6dc51f76ba`; normalized payload SHA-256 `a5a171b45294a7a5562592782ba5a5895d38b052e10fce60771571a712e390c0`. Two independent builds produced the same archive hash. Full file hashes are in [package-build.json](package-build.json).
- `codex mcp get` resolved `node ./scripts/start.mjs` to the new installed cache. The installed guide exists. Installed-cache and fresh-unpacked archive both passed the offline MCP handshake, tool discovery, all 19 hashed library reads and traversal rejection. `git diff --check` passed.
- No native AE rerun used this documentation-only successor. AFT-7/AFT-11/AFT-12 native checks used the immediately preceding installed version, whose runtime and library did not change in this refresh. A fresh Codex task must load the successor; this active task's old MCP binding failed after reinstall and was not used for more native writes.

Public source, final metadata/assets, second-machine install and release-gate review remain open. This is a local package candidate, not launch approval.

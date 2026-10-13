# Node 24 minimum offline check — 2026-10-09

Result: the local candidate's prerequisite doctor and unpacked MCP smoke passed under Node v24.0.0 on the development Mac. This narrows the minimum-version uncertainty but does not prove native AE control, an installed Codex host, or a second-Mac journey under Node 24.

The official [Node v24.0.0 macOS arm64 release](https://nodejs.org/en/download/archive/v24.0.0) was downloaded as a tarball into ignored `quality/renders/2026-10-09-node24-check/`, without replacing the system Node. SHA-256 for `node-v24.0.0-darwin-arm64.tar.gz` was `194e2f3dd3ec8c2adcaa713ed40f44c5ca38467880e160974ceac1659be60121`, matching the release's `SHASUMS256.txt`. The binary reported `v24.0.0`.

The tested plugin was the unpacked 54-file candidate `0.1.0+codex.20261008101244` from [the package report](../2026-10-08-portable-package/report.md), source ZIP SHA-256 `ec20ebffd4be6de6e7d6104b2d4ab506f476b324974bfc28f919867abe38b06a`. From `/tmp`, Node 24 ran `scripts/doctor.mjs`: all required local prerequisite checks passed, with AE found at the installed 2026 app path. The same Node 24 binary launched `plugin/tests/smoke.mjs` against the unpacked plugin; its child `node` also resolved to the isolated v24.0.0 binary. MCP handshake, discovery, all 19 hashed library reads, default craft routing, traversal rejection and offline policy-filtered catalog passed. Raw smoke output is ignored at `quality/renders/2026-10-09-node24-check/smoke/smoke-report.json`.

No AE connection or project access occurred. The exact Node 24 native create/revise/export journey and AFT-18 independent-machine install remain unverified; publish supported-version language only at the level the final candidate actually demonstrates.

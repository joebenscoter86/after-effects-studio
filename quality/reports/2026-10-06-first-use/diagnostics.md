# First-use prerequisite diagnostics

Date: 2026-10-06 (America/Los_Angeles). Ticket: [AFT-5](https://linear.app/jkbtech/issue/AFT-5/make-first-use-prerequisite-diagnostics-actionable). Scope: local setup diagnosis only; no AE launch, project inspection or mutation.

## Change

- `node plugin/scripts/doctor.mjs` reports a machine-readable JSON summary, required versus optional checks, detail and a concrete `hint` for each failed check.
- Required checks cover Node 24+, macOS/Windows, the bundled runtime, motion library manifest and an After Effects path. AE discovery follows runtime precedence (`AE_MCP_EXE`, legacy `AE_EXE`, then default 2026–2024 paths); macOS `.app` overrides must be directories.
- ffmpeg/ffprobe checks have bounded process timeouts and remain optional; missing binaries explain that they are only needed for export verification.
- The report states explicitly that it does not verify live connectivity or permissions. The README documents the separate permission step. The startup Node-version error tells the user how to correct the executable and restart the host.

## Verification

- Focused Vitest suite: 8 checks passed. Cases cover successful discovery, outdated Node, missing package files, custom and legacy AE overrides, bad `.app` type, missing optional export tools and unsupported OS guidance.
- `npm run typecheck:test` and `npm run typecheck`: passed.
- Live `doctor.mjs` on this Mac: passed required checks; found Node v25.9.0, macOS, bundled runtime/library, AE 2026 `.app`, ffmpeg and ffprobe. It explicitly reported permissions and live connection as unchecked.
- `git diff --check`: passed after the final changes.

No native AE test was run because the change is a prerequisite/file-discovery check and makes no AE calls. The JSON uses hints rather than platform-specific GUI automation so it remains inspectable by agent hosts.

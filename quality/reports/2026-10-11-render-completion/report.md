# AFT-29 — render completion evidence, development pass

2026-10-11, America/Los_Angeles. Status: **AFT-29 complete for this defect**. The AFT-27 v1 run exposed a false success: reusing a completed queue item produced no new final file, yet `render.start` returned `ok: true` and `rendered` equal to the entire queue length. The [capability report](../2026-10-10-capability-probe/report.md) contains the original observation. The AFT-27 v1/v2 exact installed-candidate evidence was not changed.

## Change

`render.start` now snapshots output paths, sizes and modification times for items actually queued before invoking AE. It returns no new renders when the queue has only completed items. After AE returns, it counts an item only if AE marks it DONE and every output path exists, is nonempty, and differs from its pre-render file state. Per-item paths and file metadata are returned for inspection. An absent, empty or unchanged output produces `ok: false` and an explicit error. A changed file with the same size and timestamp cannot be proven fresh by these signals and is conservatively rejected. A file sequence or unusual output module may require separate handling; the current implementation is scoped to concrete file paths.

This confirms file evidence, not playable media. [Delivery guidance](../../../plugin/docs/delivery.md) still requires independent media metadata and full-decode checks. The existing AFT-27 exports remain validated by their own report.

## Verification

- Seven offline execution tests pass: completed-only queue, mixed completed/fresh queue, missing or empty output despite DONE, unchanged or changed existing output, and missing output-path preflight.
- Runtime and test type checks pass. `npm run build` generated modular output, then the required `node plugin/scripts/build.mjs` restored the self-contained 1.7 MiB server bundle and indexed all 19 bundled library documents. The AFT-27 candidate and its archive were not changed.
- Full runtime suite: 413 passed, 116 skipped. The session-mutating AE suites were not opted in. The ordinary AE transport suite skipped because the app was blocked by a modal dialog.
- Strict current-tree public-source audit passed with no flagged path, token or historical Content-checkout matches. This is not a rights review.

## Native control on AE 26.5x89

The reopened Codex app restored native-tool access. Read-only inspection found the accepted AFT-27 v2 project saved and clean, with its three historical render items all DONE. A separate AE instance was unavailable because the resident agent was not installed; nothing was launched. I made a byte-identical copy of the v2 AEP under `quality/renders/2026-10-11-render-completion/` (both SHA-256 `cb8e6fdb28b4d33caa1fd26cd8a524c52aaff4f12eaee02136e3cfa14ba3cde8`), opened that copy, and ran the **exact generated JSX body from the patched source** through the then-installed controller's `eval.run`.

With only the three completed items, the body returned `ok: false`, `rendered: 0`, and “no queued render items.” I added one owned queue item for the master comp in the copied project, set **High Quality** output to a new test-only MOV path and its span to one frame, then ran the same body. It returned `ok: true`, `rendered: 1`, item 4 DONE, and a newly written 1,093,956-byte file. Independent `ffprobe` found ProRes, 1920×1080, 30 fps, one frame, 0.033333 seconds; a full `ffmpeg -v error` decode exited zero. File SHA-256: `ff0067a929022453e680df0bd21af47160cbd6e75a04de682fe4cfda3b3bdde4`. Running the body again returned `ok: false`, `rendered: 0`; the file hash stayed unchanged. This checks the fresh control and the completed-item behavior together while excluding the three historical DONE items from the count.

I reopened the original v2 AEP without saving the test copy. AE reported the original project clean, with five items. Its AEP and MOV hashes remained `cb8e6fdb28b4d33caa1fd26cd8a524c52aaff4f12eaee02136e3cfa14ba3cde8` and `6544476438a8910b2ae752003143b77a1f4f3c8d685a2ebf6cb266d0b106ec56`, matching AFT-27.

The prior blocker was an older plugin server repeatedly calling a removed dispatcher file. It was stopped before this run; AE and the saved film were preserved. At this point the installed controller still advertised the pre-fix `render.start`, so this first control used the exact patched body.

## Refreshed package and installed operation

The corrected candidate is `0.1.0+codex.20261011211837`, a reproducible 54-file local archive (SHA-256 `63833a63331f281356cb9a25cb22fb5d9e44bd0653b09eea1205fb2109707321`; payload SHA-256 `dcbd5b65b000279cd1e6a823fcf5d6e6638a6b4fb1c25a2652a8e19a09af667d`). Two builds matched byte-for-byte. Its unpacked MCP server passed offline handshake, tool discovery, all 19 hashed library reads, default craft routing, traversal rejection and catalog checks. All 54 payload files matched in the staged personal source and newly installed versioned cache; the prior stage was backed up locally. The isolated client run from the installed cache passed live read-only AE inspection without changing the clean v2 project.

The isolated installed-cache client then called the **packaged `render.start` operation** on the original project's three completed items: `ok: false`, `rendered: 0`, no queued items, unchanged project context and unchanged AEP/MOV hashes. It opened a fresh byte-identical v2 copy, queued one test-only frame, and called the packaged operation again: `ok: true`, `rendered: 1`, item 4 DONE, one newly written output. The second call returned zero with the output hash unchanged. The installed control MOV is 1,093,908 bytes, ProRes 1920×1080 at 30 fps, one frame/0.033333 seconds, SHA-256 `043652778b0012bc0aa9d7df56d92e9fbaae3dd737bbaaa57cf54f4edcfcde1c`; full ffmpeg decode exited zero. The client restored the original v2 AEP, clean with five items, and rechecked its AEP/MOV hashes. Raw package and installed checks are ignored under `quality/renders/2026-10-11-render-completion/`.

An initial installed-client preflight stopped before touching AE because the earlier test copy had changed on disk during the prior render. Re-copying the unchanged original repaired the fixture; the subsequent installed run passed. This does not change AFT-27's original candidate or demonstrate a second-Mac installation. The AFT-29 false-success condition is resolved for concrete single-file outputs on this development Mac; file-sequence output modules and playable-media integrity still require separate handling as noted above.

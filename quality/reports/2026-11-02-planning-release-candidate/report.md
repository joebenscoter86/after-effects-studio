# AFT-55 — planning update RC.2

Status: package preparation and affected checks passed; ready for candidate review and the proposed fresh planning task. No new native film or public prerelease has been created.

## Scope and identity

Joe authorized preparing the next candidate on 2026-11-02 after approving the AFT-54 source merge. This work uses the existing clean planning worktree, switched to `codex/planning-release-candidate` from main `de8464109084a001af8210e2541b74df31fda474`. The canonical dirty checkout and separate reference-motion worktree remain preserved.

The candidate is `0.2.1-rc.2+codex.20261102`. Its two distributable changes relative to the exact AFT-54 install candidate are `.codex-plugin/plugin.json` (the version) and `README.md` (the planning behavior and removal of a hardcoded old version sentence). The 65 other packaged entries are identical, including all skill, library and executable bytes. No library-manifest regeneration is appropriate because no library content changed. The unfinished AFT-53 reference-motion feature is excluded.

Archive: `release/packages/after-effects-studio-0.2.1-rc.2+codex.20261102.zip`. SHA-256: `16b8ea9dc200d8c315b03fb3b5546bb4ac85d95a699f128c7986df9ce4ab7b4d`. [Package identity](package-identity.json) records all 67 entry hashes, the slim runtime manifest and the repeated build result. Two independent builder invocations produced identical metadata and archive bytes. The package builder rejects absolute home paths and credential markers in packaged text and verifies the license/upstream notice markers.

Plugin Creator was absent from installed skill locations, including hidden system skills and bundled runtime/plugin directories. The operator used the repository's existing reproducible builder plus the supported Codex marketplace CLI; no hand-edited installed cache or global marketplace configuration was used. The Linear agent-context endpoint returned `Tool get_agent_context not found`; current issue and source were used instead. The prerequisite diagnostic initially wrote its ignored raw output in the canonical checkout's release/packages directory; it was copied to this worktree for evidence processing, without changing tracked canonical files.

## Affected verification

| Check | Result / evidence |
| --- | --- |
| Manifest, portable resources and library integrity | Pass: five skills, ten MCP tools, 29 indexed documents; extracted-ZIP module validation passed |
| Reproducible archive | Pass: 67 files, two identical builds; per-file hashes in [package identity](package-identity.json) |
| Extracted ZIP offline MCP | Pass: handshake, all 29 hashed reads, three module routes, traversal rejection, offline catalog; [ZIP smoke](zip-smoke/smoke-report.json) |
| Exact temporary install | Pass: supported local marketplace `aft55-local-test`; all 67 installed files match archive, no extras; [cache identity](installed-identity.json) |
| Installed offline MCP | Pass: same offline checks against the installed cache; [cache smoke](cache-smoke/smoke-report.json) |
| Prerequisites | Pass: macOS 26.6.2 / arm64 / Node 25.9.0, AE 2026 path and optional ffmpeg/ffprobe found; [diagnostics summary](prerequisites.json). This does not inspect a live AE project or verify permissions |
| Public interface links | Pass: website, support, privacy and terms returned HTTP 200; [link results](public-links.json) |
| Source/payload review | No runtime/library/skill changes from merged main; no credential markers or historical Content checkout strings in source audit. Absolute-path findings are evidence/scripts outside the ZIP; the >1 MiB executable bundle is expected; [audit summary](source-audit-summary.json) |
| Cleanup | Pass: temporary plugin/cache and marketplace removed, stable `after-effects-studio@jb-technology` `0.2.0+codex.20261018` remains enabled; [cleanup verification](cleanup-verification.json) |

The [AFT-54 installed planning results](../2026-11-02-aft54-installed-planning/report.md) remain applicable to the identical skill/runtime/library bytes: two clean subjects, a meaningful same-session correction and a missing-essential-assets negative, all with GPT-6 Astra. These are carried-forward results, not newly rerun RC.2 agent sessions. The earlier runtime test suite and native acceptance films were not rerun because this patch does not change their code or library. The local offline/install checks above are new. No new AE version/context call, native mutation, render, separate-Mac install or creative acceptance occurred.

## Next original-brief test

The proposed [creator brief](../../fixtures/2026-11-02-lock-cutaway-brief.md) asks why the right key turns a pin-tumbler lock, with a dark engineering-cutaway direction. The factual input is the first page of the [manufacturer's explanation](https://s7d5.scene7.com/is/content/BDHHI/reykey%20instruction/pin-tumber-locks.pdf); it supports key cuts positioning pin pairs at the shear line. No illustration or logo is copied as artwork. The agent must choose and mark its own story, duration, framing, assets and proposed copy.

The [end-to-end handoff](end-to-end-test-handoff.md) deliberately does not supply a finished storyboard: the installed candidate must propose its own creator story and builder plan without the parent filling in missing fields. It then stops for Joe's plan approval before AE. Later stages cover an owned native project, a hard passage plus ordinary explanation, AE scrubbing as the primary review surface, a meaningful late edit chosen after the first build is reviewable, and editable project/export verification. Proposed bounds and model/settings are explicit. No new evaluator has been launched under this ticket.

## Release boundary

The candidate and [action sheet](../../../release/submission/planning-rc2-action-sheet.md) are prepared for review. Main, public tags, GitHub Release assets, stable marketplace configuration and directory submission were not changed. A draft PR exposes the proposed source for review; merging the RC version into main would itself change unpinned marketplace installs and is not part of preparation. A later authorized prerelease can instead tag the reviewed branch commit and use a pinned install. Public stable remains v0.2.0. First obtain Joe's choice of the next test direction/session, then the fresh agent's actual plan approval; publication remains a distinct decision.

## AFT-56 continuation — same day

After AFT-55 preparation closed, Joe authorized the fresh lock-cutaway planning session. The [separate planning report](../2026-11-02-lock-cutaway-planning/report.md) now preserves its 22-second first proposal, exact model/settings and trace. Planning structure/isolation passed; one precise copy correction is proposed for approval, and the axial turn remains a native proof point. The actual story/build plan awaits Joe's approval. The archive and distributable payload are unchanged; this continuation adds evidence only and does not retroactively turn AFT-55's earlier checks into a native pass.

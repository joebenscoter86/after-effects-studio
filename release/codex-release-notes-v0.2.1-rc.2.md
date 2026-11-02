# After Effects Studio v0.2.1-rc.2 — release candidate

Status: prepared locally for review and end-to-end testing; no tag or GitHub Release has been published. Public stable remains v0.2.0.

This candidate improves the step between an ordinary creator brief and an editable After Effects build. The motion-studio skill now provides two deliverables: a short story proposal for the creator and a separate construction-ready beat plan. The plan specifies proposed copy, frame timing, assets and fonts, persistent objects, difficult handoffs and observable review targets. A request to seek approval before AE pauses native execution after both plans exist. Ideas-only requests stay proportional, and missing essential product/brand assets remain explicit blockers for a faithful build.

The native runtime, all 29 library documents, licenses, publisher identity and supported platform scope retain the v0.2.0 baseline. The five-skill set is preserved; motion-studio includes the already merged AFT-54 planning change. No reference-video reconstruction feature is included. AFT-53 remains separate work.

The bundled README now explains the planning behavior. Candidate version: `0.2.1-rc.2+codex.20261102`. Proposed prerelease tag, only if later authorized: `v0.2.1-rc.2`.

## Verification

- AFT-54's exact installed candidate passed two clean planning subjects, a meaningful same-session correction and a missing-essential-assets negative using GPT-6 Astra. The tested skill, library and runtime bytes are identical in this candidate. This carries forward bounded planning evidence; no new creative or native-film acceptance is claimed.
- The 67-file ZIP rebuilt twice with identical bytes. Extracted-ZIP and exact installed-cache MCP smoke passed handshake, all 29 hashed library reads, module routes, traversal rejection and the offline operation catalog. Every installed file matched the ZIP, with no extra files.
- Local prerequisite diagnostics passed on macOS 26.6.2 / arm64 / Node 25.9.0. The doctor found AE 2026 and optional ffmpeg/ffprobe; it does not verify live permissions or native project execution. The temporary installation and marketplace were removed afterward; stable v0.2.0 remains enabled.
- All four public manifest URLs returned HTTP 200. The native runtime was unchanged, so the earlier runtime suite is historical evidence rather than a newly rerun suite.

No new native create/revise/export/reopen journey or separate-Mac RC.2 test has occurred. The next end-to-end test will first obtain approval of the agent's proposed story and build plan, use an owned AE project, review motion primarily by scrubbing AE, then verify a meaningful revision and editable delivery. A good planning answer does not establish the quality of an unbuilt film.

The initial supported target remains Codex desktop on macOS with licensed local After Effects 2026 and Node.js 24+. Windows and other AE versions are unverified product support. The included original-material license and separate upstream notices still apply. Asset generation remains optional. OpenAI directory eligibility and submission are separate from this Git-backed candidate.

Archive: `after-effects-studio-0.2.1-rc.2+codex.20261102.zip` (local, not uploaded). SHA-256: `16b8ea9dc200d8c315b03fb3b5546bb4ac85d95a699f128c7986df9ce4ab7b4d`.

For a future authorized public prerelease, install from its specifically reviewed Git ref or ZIP; do not assume the unpinned stable marketplace has this candidate. Start a fresh Codex session after a supported install. The source Git tree includes development files; the ZIP is the curated standalone package with a slim private runtime manifest. Executable, library and skill files match source.

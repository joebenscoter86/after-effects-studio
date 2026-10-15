# After Effects Studio — Codex release notes draft

Status: **pre-release review copy, not a stable-release announcement.** Candidate on [draft PR #2](https://github.com/joebenscoter86/after-effects-studio/pull/2): plugin `0.1.0+codex.20261015232719`, ZIP SHA-256 `95dd810919b9761b7a20a4c74575253ae041656919411bc4f48615d454fa2226`. AFT-23 must approve the exact final bytes and AFT-24 requires specific publication authorization before this copy is used.

After Effects Studio creates and revises editable motion graphics in local Adobe After Effects from plain-language direction. It bundles a production-derived motion-design library, three creation/control/review skills, and a local native controller. You can inspect an open AE project, build compositions with native layers and keyframes, render previews, revise existing work, save AEPs and export a movie. The included guidance adapts to your subject and style; the optional JoeB look is not required.

The initial Codex route targets local Codex desktop on macOS with licensed After Effects 2026 and Node.js 24+. A separate-Mac first install and full create/revise/save/export/reopen journey passed on macOS 26.6.2, AE 26.5x89, Node 26.5.0 and Codex desktop 26.930.61225 using the previous public-Git package. The new candidate's executable runtime, native JSX and motion library are byte-identical to that tested package; its manifest, icon and documentation changed. The lifecycle update/removal/restore check also passed in isolated Codex CLI tasks on the development Mac against the preceding candidate with identical native runtime. Windows and other AE versions are not verified product support. The original separate-Mac installer transcript was not retained; this is Joe-operated portability evidence, not novice usability testing.

Install the [public Git marketplace](https://github.com/joebenscoter86/after-effects-studio) with:

```text
codex plugin marketplace add joebenscoter86/after-effects-studio
codex plugin add after-effects-studio@jb-technology
```

Start a new Codex task after installation, inspect the exact current AE project read-only, then follow the [first-session guide](../plugin/docs/first-session.md). Use your normal macOS Automation and AE scripting-file-access permissions. The executable local Node controller can read project structure and local paths, create/change/delete AE items, run custom AE scripting, and save projects/exports you direct. `AE_MCP_READONLY=1` restricts writes; `AE_MCP_ENABLE_EVAL=0` disables custom scripting. No Git clone, source build, npm install or manual MCP config edit is required for ordinary use. The [install/update/removal guide](../plugin/docs/local-install.md) explains how to remove the plugin without deleting AEPs or renders, and how to restore a known package if direct rollback is unavailable.

Free use covers personal and paid client motion work and delivery of editable AE projects. Joe's original plugin and motion-library materials may not be repackaged or resold as a standalone product; see the [original-material license](../plugin/license.md). Upstream runtime and dependencies keep their separate licenses and notices. Adobe software, paid fonts, footage, product artwork and optional asset-service accounts are not bundled. User-supplied media remains subject to its own rights.

Movie verification requires metadata and a complete decode, plus normal-speed visual review. The optional bundled `verify-export.mjs` uses FFmpeg/ffprobe; those tools are not required for ordinary plugin use. On a Mac without them, the separate-Mac acceptance used AVFoundation to decode all 168 frames of the test H.264 movie. AE's render success alone does not prove the file is sound. A timed-out write may have executed: inspect AE state before retrying. The plugin cannot control every Adobe UI dialog or unsupported third-party effect property; query the native catalog and report limits.

See [product](website/index.md), [support](website/support.md), [privacy](website/privacy.md), [terms](website/terms.md) and the [redacted separate-Mac test report](https://github.com/joebenscoter86/after-effects-studio/issues/1). This is a Codex Git marketplace release path. It is not an OpenAI universal-directory listing or approval.

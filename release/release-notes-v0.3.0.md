# After Effects Studio and Comp Room v0.3.0

This release gives the agent ways to check its own work, cut a subject out of footage, work to a reference, and deliver a finished file. Comp Room 0.3.0 has 13 tools and 253 operations, up from 12 tools and 219 operations in 0.2.1. Its library has 106 documents and 31 visual styles.

- **Checking a piece the way a viewer watches it.**
  - A new tool, `ae_check_comp`, checks a whole comp in one call. It flags pops, cuts, stutters, frozen stretches, near-black and clipped frames, text leaving the frame or the safe area, and missing fonts or footage, with a contact sheet.
  - `ae_render_frame` can show the matte and isolate a layer. It can also read colour, edges, a green screen, frame-to-frame change, and grain and levels against a plate.
  - `motion.curve` reads each move's speed and flags missing ease, jumps and overshoot.
  - `sound.markers` and `sound.sync` place word and beat markers and say how far events sit from them.
  - In Claude, a reviewer agent that did not build the piece checks it before it is called done.
- **Cutting a subject out** with After Effects 2027's Object Matte. You make one click; the `subject.*` operations prepare the footage, check the matte, render the cut-out once, check every frame of the file and build on it. There are also checks for disk space and cache.
- **Keying:** `key.keylight` keys from measured values, and `key.cleanup` runs Key Cleaner and Advanced Spill Suppressor in Adobe's order. `effect.describe` lists every settable property with its range, and out-of-range effect values are refused.
- **Working to a reference:**
  - `reference.report` and `reference.compare` measure a still, frames, a movie or a comp, and list the differences in words.
  - `reference.sheet` measures what stays the same across pieces you have approved, so a new build can be compared with your own range.
- **Tearing down a reference's motion from a video file** with ffmpeg, without After Effects: `video.shots`, `video.census`, `video.track` and `video.moves`.
- **Hand-over and delivery:**
  - `project.lint` checks whether another person could work in the project.
  - `render.deliver` renders to a preset and then checks the written file: size, rate, duration, sound, loudness and true peak.
  - `render.mux_audio` joins a picture with an outside mix without re-encoding.
  - `render.preview` makes a quick movie to watch at speed.
- **Safer scripting:**
  - A call that fails is rolled back, and says whether that worked.
  - `project.snapshot` and `project.restore` keep numbered copies of the project.
  - After a script changes the render queue, undo is refused unless asked for, because undo there has crashed After Effects 2027.
  - On macOS, the plugin no longer sends After Effects a second script while one is still running. That could raise After Effects' own warning dialog. Calls from any number of sessions now go one at a time.
- **The library:**
  - new guides for keying and cut-outs, review, reference teardown, unattended runs, page recording and word timing;
  - a new visual style, Pixel headline;
  - long documents are read in parts;
  - a library search now matches each word of a query.

**Changes existing users will notice:**
- `ae_render_frame` names multi-frame files `<stem>_<call id>_<index>.png`.
- `ae_library` returns documents as text with a header line.
- `ae_project_info` returns 100 items a reply, with paging.
- `project.undo` reports commands run and whether the project changed.
- Readings that do not match the viewer in a colour-managed project are refused.

For Codex users coming from v0.2.0, this release also carries everything that shipped in Comp Room 0.2.1: the 30-style library, After Effects discovery, and the corrected `project.open`.

**The reference teardown is in, with one weak part.** `video.shots`, `video.census` and `video.moves` take a reference clip apart into its shots, its pans and other moves, and a census of what moves on screen.
- **What held:**
  - The movement census agreed step for step with a hand study's labels on five reels, at 97 to 99.8 %.
  - Every pan on a test reel was read as a pan, not a cut.
  - On that reel the shot list found 6 of the 7 hard cuts, with 3 false cuts.
- **What did not:** the tracker that times each move (`video.track`, and the moves built on it) is not reliable on real moves. Against a hand study it was within tolerance on 6 of 15 moves, and it can be confidently wrong. Treat its moves as a first guess to check by eye.
- **Not measured:** rotation, perspective, motion blur, colour change and depth.

**Not in this release:**
- Building from a reference to a finished look. The teardown measures a reference's motion, but carrying its lighting, shadows and finish into a new build is still to come.
- The Deep Glow plugin. It is not wired in; the Pixel headline style uses After Effects' own Glow, which falls short of Deep Glow far from the word.

**Where it was built and checked.** The new stages were built and checked in Claude, through Comp Room. No Codex session has run the new operations yet. The Codex package carries the same server and guidance, but treat its new operations as untested in Codex.

For visually demanding builds, use the most capable model your host offers. A lower-cost model can still build editable drafts; treat its render as a draft until the delivered frames pass visual review. Review full-size rendered frames and playback with any model.

The plugin is free to use for personal and paid client motion work under the included original-material license, with separate upstream notices. It runs a bundled local Node server against a licensed local After Effects installation on macOS, with Node.js 24 or newer. Comp Room targets After Effects 2027 in Claude Code or a Cowork session on the Mac. Windows and other After Effects versions are not verified product support. `ffmpeg` and `ffprobe` are optional; some footage and keying operations use them when they are installed.

**Verification for this release:**
- **Runtime tests:** 1,493 passed and 117 skipped, under a system profile that refuses to start `osascript`, so no test reached After Effects.
- **Packaging:** the TypeScript type-checks, 123 release tests, the offline MCP smoke test for both packages, `claude plugin validate --strict` for the marketplace and for the package, and the public-source audit all passed. The 185-file Codex ZIP builds deterministically.
- **Live, on the development Mac, 2026-11-14:** the new launch lock was checked against a running After Effects.
  - A read came back in 282 ms.
  - A read sent while After Effects was paused for 15 seconds waited and came back, with one script launch at a time across separate servers.
  - A server inside a `claude plugin eval` sandbox took the same lock.
- **Evals on the final build:** <EVALS: planning-set and picture-set scores on this build, filled in after they run>.
- **Not run for this release:** the plan's acceptance test, a fresh build watched once at speed; a separate-Mac install; any Codex session; and Windows.

Install Comp Room in Claude Code, or update it:

```text
claude plugin marketplace add joebenscoter86/after-effects-studio
claude plugin install comp-room@jb-technology

claude plugin marketplace update jb-technology
claude plugin update comp-room@jb-technology
```

Install or update After Effects Studio in Codex:

```text
codex plugin marketplace add joebenscoter86/after-effects-studio
codex plugin marketplace upgrade jb-technology
codex plugin add after-effects-studio@jb-technology
```

Start a new session after installing. See the [Comp Room README](https://github.com/joebenscoter86/after-effects-studio/blob/main/claude/comp-room/README.md), the [Codex installation and permissions guide](https://github.com/joebenscoter86/after-effects-studio/blob/main/plugin/docs/local-install.md), [support](https://github.com/joebenscoter86/after-effects-studio/blob/main/release/website/support.md), [privacy information](https://github.com/joebenscoter86/after-effects-studio/blob/main/release/website/privacy.md), and [terms](https://github.com/joebenscoter86/after-effects-studio/blob/main/release/website/terms.md).

The Git marketplaces install the reviewed source: Comp Room from `claude/comp-room/`, generated from `plugin/`, and After Effects Studio from `plugin/`. The attached ZIP is a curated 185-file standalone Codex package with a slim private `runtime/package.json` in place of the upstream development manifest. SHA-256 for `after-effects-studio-0.3.0+codex.20261114.zip`: `<SHA-256: from release/build-package.py at release time>`.

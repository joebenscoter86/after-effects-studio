# After Effects Studio and Comp Room v0.4.0

This release gives the agent a cookbook of After Effects techniques, filed by the job a beat has to do, and a tool that answers a beat from it. Comp Room 0.4.0 has 14 tools, up from 13 in 0.3.0; its 253 operations are unchanged. Its library has 113 documents and 31 visual styles.

- **A new tool, `ae_arsenal`:**
  - `jobs` lists the vocabulary: 27 jobs a beat can ask for, such as landing a number, adding depth or handing over to the next picture.
  - `find` answers one beat with a ranked shortlist of proven techniques, each with a still of our own proof build.
  - `get` reads the chosen recipe at a pinned revision.
- **The cookbook:** 64 recipes learned from five public After Effects tutorials and written in our own words.
  - 24 are proven. Each was built in After Effects from the recipe alone, on generated art, compared with the tutorial's result and accepted on review.
  - The other 40 are unproven. `find` returns them when asked, or when no proven recipe fits the beat, marked as needing a test build first.
  - The plugin ships no footage, frames or transcript text from the tutorials, and names no creator.
- **Asked per beat.** The server's instructions and the motion-studio skill tell the agent to ask `ae_arsenal` for each beat by its job before building, and to build from the library as before when nothing comes back.
- **The channel learner** is a development tool in the repository (`tools/channel-learner/`), not part of the plugin. It turns a tutorial into checked recipes, and one command rebuilds the shipped cookbook from them.

**Changes existing users will notice:**
- When planning shots, the agent now calls `ae_arsenal` once a beat. It reads only files bundled with the plugin.

**Not in this release:**
- Building from a reference to a finished look. It is the next piece of work.
- The Deep Glow plugin. It is not wired in.

**Where it was built and checked.** The cookbook and `ae_arsenal` were built and checked in Claude, through Comp Room. No Codex session has run them, or the operations new in 0.3.0. The Codex package carries the same server and guidance, but treat them as untested in Codex.

For visually demanding builds, use the most capable model your host offers. A lower-cost model can still build editable drafts; treat its render as a draft until the delivered frames pass visual review. Review full-size rendered frames and playback with any model.

The plugin is free to use for personal and paid client motion work under the included original-material license, with separate upstream notices. It runs a bundled local Node server against a licensed local After Effects installation on macOS, with Node.js 24 or newer. Comp Room targets After Effects 2027 in Claude Code or a Cowork session on the Mac. Windows and other After Effects versions are not verified product support. `ffmpeg` and `ffprobe` are optional; some footage and keying operations use them when they are installed.

**Verification for this release:**
- **Runtime tests:** 1,525 passed and 117 skipped, under a system profile that refuses to start `osascript`, so no test reached After Effects.
- **Packaging:** the TypeScript type-checks, 123 release tests, the offline MCP smoke test for both packages, `claude plugin validate --strict` for the marketplace and for the package, and the public-source audit all passed. The 210-file Codex ZIP builds deterministically.
- **The proven recipes:** each of the 24 was built live in After Effects 2027 on the development Mac on 2026-11-14.
- **Evals,** through `claude plugin eval`, one run a case unless stated:
  - Planning set, 22 cases: overall 0.78, against 0.80 for 0.3.0. Sessions planning a piece beat by beat called `ae_arsenal`: a `jobs` call, then a `find` per beat. The hand-over case scored 0.57 once, then 1.00, 1.00 and 0.86 over three reruns.
  - One planning case dropped. The pixel-headline talking-head plan, below the bar since 0.3.0, averaged 0.40 over four runs, against 0.62 over three runs of the 0.3.0 package on the same day. Its sessions read the same documents and do not call `ae_arsenal`, but their plans more often leave out the style's look still and its whole-piece check. The cause is not isolated.
  - Picture set, 8 cases: overall 0.91. Five scored 0.9 or more, four of them 1.0. Keying (0.83) and footage (0.88) each missed one judged requirement, and the review case scored 0.67, on a known fault in the case itself.
- **Not run for this release:** a separate-Mac install; any Codex session; and Windows.

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

The Git marketplaces install the reviewed source: Comp Room from `claude/comp-room/`, generated from `plugin/`, and After Effects Studio from `plugin/`. The attached ZIP is a curated 210-file standalone Codex package with a slim private `runtime/package.json` in place of the upstream development manifest. SHA-256 for `after-effects-studio-0.4.0+codex.20261115.zip`: `917fdfa37d0b99b04f3598e15de5a72ccd80411b71e56e8f0bb41ede8935a3c3`.

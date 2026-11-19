# After Effects Studio and Comp Room v0.4.1

This release fixes what a long finished build showed up: a glow that rendered a trial watermark, long passes that ran without warning, hard edges on moving hands, and layers left sitting still. Comp Room 0.4.1 has 14 tools, as in 0.4.0, and 254 operations, up from 253; the new one is `subject.motion_edge`. Its library has 113 documents and 31 visual styles.

- **A licensed Deep Glow, or the stock glow.** The pixel-headline style used Deep Glow whenever it was installed, so an install without a licence rendered the trial watermark.
  - The style now uses Deep Glow only when it is installed and licensed, which it tells by the licence file in Application Support. Otherwise it builds the stock glow, and the build report says "Deep Glow is installed but not licensed; used the stock glow".
  - With a licence stored somewhere else, pass `licensed: true` to use Deep Glow anyway.
  - Asking for Deep Glow by name on an unlicensed install still uses it, and the report warns that the watermark will render.
  - Checked live in After Effects 2027.
- **Long subject passes come with an estimate.** Before a subject pass that can run for minutes (rendering the cut-out, the soft edge's self-check, checking a long file, the render after a motion edge), the agent times a few frames on your machine, tells you how long the whole pass should take, then starts it. The times and cache sizes quoted in the guidance are each labelled as measured on one machine; the estimate you hear always comes from your own machine.
- **A new operation, `subject.motion_edge`:** a soft edge only where the subject moves.
  - After the Object Matte cut-out, one call keeps the crisp outline everywhere and adds a soft, motion-blurred edge where hands and arms move. It needs a machine-learning keyer effect you install separately; you pass its match name, and the plugin names no keyer product.
  - `undo: true` removes it and puts the matted layer back.
  - `subject.render_cutout`, `subject.check`, `subject.check_file`, `subject.use_cutout`, `subject.fill_gaps` and `subject.status` all use the motion-edge layer, and `subject.check` does not count the keyer's soft edge on moving parts as a fault.
  - The soft edge and the motion edge do not combine: each refuses a layer that has the other. Both undos refuse while the cut-out movie is in the comp, which would otherwise show the subject twice.
  - It is confirmed only on English After Effects, because some effect settings are found by their English names.
  - Checked live on a 1920 × 1080 take in After Effects 2027.
- **`ae_check_comp` reports idle layers.** Its new `structure.idle` lists each layer that stays on screen longer than `idleSeconds` (default 5; 0 turns it off) with nothing changing on it, with the span and how long it lasted.
  - It is a report, never a fault.
  - Stretches where the layer cannot be seen (opacity or scale at 0) are skipped. Wiggle selectors and wiggle shape operators count as motion.
  - Checked live on a 29-layer comp.
- **Guidance:**
  - In a project with its own house style, the agent reads the motion-studio skill and the brief template first, then the project's own standard.
  - The independent reviewer runs once, before your first look at the motion, and after that only when you ask.
- **For the repository:** `npm run check` passes again.

**Changes existing users will notice:**
- On a Mac with Deep Glow installed but not licensed, pixel-headline builds now use the stock glow, and the report says so.
- Before a long subject pass, the agent stops to tell you its estimate.
- `ae_check_comp` replies carry `structure.idle`.
- The reviewer no longer runs every round.

**Not in this release:**
- Two techniques from the same build, re-proven on generated art, and a speaker-in-a-real-room variant of the pixel-headline style. They are planned for 0.4.2.

**Where it was built and checked.** Everything new was built and checked in Claude, through Comp Room, on the development Mac. No Codex session has run it, or the operations new in 0.3.0 and 0.4.0. The Codex package carries the same server and guidance, but treat them as untested in Codex.

For visually demanding builds, use the most capable model your host offers. A lower-cost model can still build editable drafts; treat its render as a draft until the delivered frames pass visual review. Review full-size rendered frames and playback with any model.

The plugin is free to use for personal and paid client motion work under the included original-material license, with separate upstream notices. It runs a bundled local Node server against a licensed local After Effects installation on macOS, with Node.js 24 or newer. Comp Room targets After Effects 2027 in Claude Code or a Cowork session on the Mac. Windows and other After Effects versions are not verified product support. `ffmpeg` and `ffprobe` are optional; some footage and keying operations use them when they are installed.

**Verification for this release:**
- **Runtime tests:** 1,643 passed and 117 skipped, under a system profile that refuses to start `osascript`, so no test reached After Effects.
- **Packaging:** `npm run check` (type-checks, lint, formatting, the JSX lint and the tools document), 123 release tests, the offline MCP smoke test for both packages, `claude plugin validate --strict` for the marketplace and for the package, and the public-source audit all passed. The 210-file Codex ZIP builds deterministically.
- **Live checks:** the licence check, the motion edge and the idle report were each checked in After Effects 2027 on the development Mac, as listed above.
- **Not run for this release:** the evals; a separate-Mac install; any Codex session; and Windows.

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

The Git marketplaces install the reviewed source: Comp Room from `claude/comp-room/`, generated from `plugin/`, and After Effects Studio from `plugin/`. The attached ZIP is a curated 210-file standalone Codex package with a slim private `runtime/package.json` in place of the upstream development manifest. SHA-256 for `after-effects-studio-0.4.1+codex.20261119.zip`: `b1fe0ea00a3a1e662f0540b1b22c47bd5a5ba71b0d34bc00fed7afb2f53d313c`.

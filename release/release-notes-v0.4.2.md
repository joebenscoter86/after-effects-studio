# After Effects Studio and Comp Room v0.4.2

The technique cookbook grows from 24 proven techniques to 57. `ae_arsenal` now returns 57 recipes that were built in After Effects from the recipe alone, on generated art, and accepted on review. Each of the 48 proven techniques among them comes with a still from its own proof build. Comp Room 0.4.2 has 14 tools and 254 operations, as in 0.4.1. Its library has 113 documents and 31 visual styles.

- **33 more proven recipes.** They come from a second tutorial video (11, accepted 2026-11-16) and from recipes studied earlier and proven afterwards (22, accepted 2026-11-19). They join the 24 from 0.4.0:
  - **Depth and staging:** window-light shadow maps and a wipe-on for them, a cut-out seated with a soft doubled drop shadow, graphics tucked behind a person with an automatic object matte, a flat UI graphic on a glossy extruded plate, a wide-lens camera inside a ring of cards, and flat cut-outs pushed into a deep stage.
  - **Backdrops and finishes:** soft blurred shapes with a bright stroke fringe, pockets of light from blurred edge shapes, a liquid merge of outlined circles, lens blur at the frame sides with fine grain, a wiggled-glow finish for bright scenes, one mood grade for mismatched art, and a film-stock grain finish.
  - **Lists and loops:** a card swinging round a pivot below the frame, a card that shrinks and leans at the ends of its swing, cards orbiting a mask ellipse, cards growing along a drawn path, a counter-spinning tunnel of card boxes, a looping wind sway, and grass rippling in the wind.
  - **Lighting:** a shadowless parallel backlight, a soft point-light front fill, and a face side-lit with a matted Curves layer.
  - **Also:** bevelled 3D text wrapped in a tiled material, a dark mass split open behind a travelling ball, rain slanted to match the wind, and depth of field on a row of glossy plates.
  - **Build aids:** swapping a layer's photo while keeping everything built on it, and keying a rough, unevenly lit green backdrop with a machine-learning keyer.
  - **Not filed under a job:** a long-lens close-up that matches the wide shot. You can still read it with `get`.
- **Variants.** When a technique was taught in more than one way, the other ways are filed as its variants. A `find` returns the main technique, its candidate lists the variants' ids, and `get` reads each one. A variant is never a separate candidate. 13 recipes are variants, 2 of them proven.
- **For the repository:** the Claude package's runtime is bundled. Comp Room shipped its runtime as 289 separate files, 267 of them dependency files, and the new stills would have taken the package past the plugin directory's limit of 512 files. The dependencies are now bundled into readable chunks, one or more per package, each package's license beside them. The runtime is 42 files and the package 271. The server behaves as before: a test compares its tool list and replies with those of the Codex bundle of the same source, and both packages pass the offline smoke test.

**Changes existing users will notice:**
- `ae_arsenal find` returns more candidates for most jobs, and some candidates list `variants`.
- Comp Room's runtime folder holds `dist/vendor/` and `licenses/` in place of `node_modules/`. Nothing needs installing.

**Not in this release:**
- The two techniques from the finish-line build, re-proven on generated art; a speaker-in-a-real-room variant of the pixel-headline style; and a library of materials for 3D text and shapes. All three are planned for a later release.

**Where it was built and checked.** The recipes were proven in Claude, through Comp Room, on the development Mac. No Codex session has run them, or the operations new in 0.3.0, 0.4.0 and 0.4.1. The Codex package carries the same server and guidance, but treat them as untested in Codex.

For visually demanding builds, use the most capable model your host offers. A lower-cost model can still build editable drafts; treat its render as a draft until the delivered frames pass visual review. Review full-size rendered frames and playback with any model.

The plugin is free to use for personal and paid client motion work under the included original-material license, with separate upstream notices. It runs a bundled local Node server against a licensed local After Effects installation on macOS, with Node.js 24 or newer. Comp Room targets After Effects 2027 in Claude Code or a Cowork session on the Mac. Windows and other After Effects versions are not verified product support. `ffmpeg` and `ffprobe` are optional; some footage and keying operations use them when they are installed.

**Verification for this release:**
- **The proven recipes:** each of the 33 new ones was built live in After Effects 2027 on the development Mac, from the recipe alone, on generated art, compared with the tutorial's result and accepted on review.
- **Runtime tests:** 1,659 passed and 117 skipped, under a system profile that refuses to start `osascript`, so no test reached After Effects.
- **Packaging:** `npm run check` (type-checks, lint, formatting, the JSX lint and the tools document), 124 release tests, 170 channel-learner tests, the offline MCP smoke test for both packages, `claude plugin validate --strict` for the marketplace and for the package, and the public-source audit all passed. The 240-file Codex ZIP builds deterministically.
- **Not run for this release:** the evals; a separate-Mac install; any Codex session; and Windows. The runtime bundling changes no code path in After Effects, and it was not run against After Effects.

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

The Git marketplaces install the reviewed source: Comp Room from `claude/comp-room/`, generated from `plugin/`, and After Effects Studio from `plugin/`. The attached ZIP is a curated 240-file standalone Codex package with a slim private `runtime/package.json` in place of the upstream development manifest. SHA-256 for `after-effects-studio-0.4.2+codex.20261119.zip`: `b1fa76b9c2ff6dbae5f60b30da6c6ddb3a317e0d8ab4aad7a57ce9770da43aff`.

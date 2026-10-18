# After Effects Studio v0.2.0

This Git-backed release expands the built-in motion system while keeping the local, editable After Effects workflow. It adds specialist typography and paper-collage skills, 29 indexed guidance and code resources, worked examples, module discovery, and native JSX helpers for type and layered paper. The motion foundation now gives agents more explicit direction on construction, continuity, timing, failure checks and delivery review. The plugin has five skills and ten MCP tools.

For ambitious visual work, start with an available GPT-6-family model or newer; GPT-6.1 Sol and GPT-6 Astra are the suggested starting points. In a controlled local six-lane study, GPT-5.6 Luna/high completed the technical tasks but had viewer-visible faults in three first-pass movies. Separate GPT-6 Astra/high confirmations cleared the sampled faults. This is a quality recommendation, not a requirement or guarantee. Review full-size rendered frames and playback with any model.

The plugin remains free to use for personal and paid client motion work under the included original-material license, with separate upstream notices. It runs a bundled local Node controller against a licensed local After Effects installation. The supported release target is Codex desktop on macOS with After Effects 2026 and Node.js 24+. Windows and other AE versions are not verified product support. Asset generation is optional; native paper methods are stylized, and photo-real paper or handwriting may need separately generated or user-supplied assets.

Verification for this release: 517 runtime tests passed, 109 skipped; TypeScript typecheck, library validation, public-source audit, deterministic 67-file ZIP build, extracted-ZIP library validation and offline MCP smoke passed. The expanded release candidate passed native AE create/revise/save/export/reopen checks and an isolated fresh-agent task on the development Mac. Version 0.2.0 itself has not yet been installed on a separate Mac. A known upstream composite `npm run check` limitation on ExtendScript `#include` parsing remains; targeted runtime and package checks passed. OpenAI directory review is separate and this Git release does not imply directory approval.

Install or update from the public Git marketplace:

```text
codex plugin marketplace add joebenscoter86/after-effects-studio
codex plugin marketplace upgrade jb-technology
codex plugin add after-effects-studio@jb-technology
```

Start a new Codex task after installation. See the [installation and permissions guide](https://github.com/joebenscoter86/after-effects-studio/blob/main/plugin/docs/local-install.md), [support](https://github.com/joebenscoter86/after-effects-studio/blob/main/release/website/support.md), [privacy information](https://github.com/joebenscoter86/after-effects-studio/blob/main/release/website/privacy.md), and [terms](https://github.com/joebenscoter86/after-effects-studio/blob/main/release/website/terms.md).

The Git marketplace installs the reviewed `plugin/` source. The attached ZIP is a curated 67-file standalone package with a slim private `runtime/package.json` in place of the upstream development manifest; its executable bundle, guidance, skills and plugin manifest match the Git source. SHA-256 for `after-effects-studio-0.2.0+codex.20261018.zip`: `d58b176a0ee45c021fce589088c6ce8b2ae79616ab89c8afae8ba018593cb3e9`.

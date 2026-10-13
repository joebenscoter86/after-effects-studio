# Planned Git-backed Codex marketplace route

Status: source wiring prepared; no public repository or live install has been created. D-006 selects this route for the first public Codex release. It is separate from universal-directory submission for a local AE controller.

The repository's [marketplace catalog](../../.agents/plugins/marketplace.json) declares `jb-technology` and points its `after-effects-studio` entry at `./plugin`, the maintained package directory. Its local path and plugin manifest name/version were checked on 2026-10-08. This source wiring follows [OpenAI's current marketplace layout](https://developers.openai.com/plugins/build/plugins), which resolves `source.path` from the marketplace root and supports a Git-backed source. The source repo includes development files as well as the installable package, while the reproducible ZIP contains only the 54 selected installable files. Audit the entire tracked Git tree before publication; the ZIP scan alone is insufficient.

Once a reviewed repository actually exists under the selected `joebenscoter86` GitHub account, the proposed user path is:

```text
codex plugin marketplace add joebenscoter86/after-effects-studio
codex plugin add after-effects-studio@jb-technology
```

These are draft commands. Do not present them as working installation steps until the repository is public, its catalog resolves, and the exact commands succeed on a separate Mac without a preconfigured marketplace or cache. Record the resulting installed version and byte hashes. The recipient still needs Codex desktop, Node 24+ subject to final version testing, licensed AE 2026, and local AE/macOS permissions. A fresh Codex task must verify the plugin's own skills and AE tools after installation.

The public repository would also be the proposed home for installation documentation, Issues support, and versioned privacy/terms text. Under D-013, AFT-20 prepares reviewed publisher/content ownership, AFT-31 reviews the exact source/history/rights, and AFT-32 publishes reviewed infrastructure after specific authorization and verifies real HTTPS destinations before they enter metadata. Publishing this infrastructure exposes downloadable source/catalog before a stable announcement; disclose that in the action sheet. AFT-34 rehearses actual public Git installation before AFT-23 final candidate review. AFT-24/AFT-25 handle authorized stable Codex publication and public acceptance. Directory work is separate in AFT-30/AFT-35/AFT-36.

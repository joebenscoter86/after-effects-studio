# Public Git-backed Codex marketplace route

Status: the reviewed source repository is [public](https://github.com/joebenscoter86/after-effects-studio). The exact CLI install and offline smoke passed on the development Mac on 2026-10-13. Joe confirmed a first install on a separate Mac, and the installed public-Git payload passed the native journey on 2026-10-15 under AFT-18/AFT-34. The original installer transcript was not captured; the [redacted work-Mac report](https://github.com/joebenscoter86/after-effects-studio/issues/1) identifies the tested candidate and limitations. D-006 selects this route for the first public Codex release. It is separate from universal-directory submission for a local AE controller.

The repository's [marketplace catalog](../../.agents/plugins/marketplace.json) declares `jb-technology` and points its `after-effects-studio` entry at `./plugin`, the maintained package directory. Its local path and plugin manifest name/version were checked on 2026-10-08. This source wiring follows [OpenAI's current marketplace layout](https://developers.openai.com/plugins/build/plugins), which resolves `source.path` from the marketplace root and supports a Git-backed source. The source repo includes development files as well as the installable package, while the reproducible ZIP contains only the 54 selected installable files. Audit the entire tracked Git tree before publication; the ZIP scan alone is insufficient.

The public source command path is:

```text
codex plugin marketplace add joebenscoter86/after-effects-studio
codex plugin add after-effects-studio@jb-technology
```

These commands installed the plugin from public Git commit `13b44b3d72ea6dd00dd6312933504fa383528676` on the development Mac. The [bounded development rehearsal](../../quality/reports/2026-10-13-public-git-dev-rehearsal/report.md) confirmed marketplace source, installed version and key byte hashes plus offline MCP smoke. Joe then confirmed a first install on his separate work Mac. Its installed plugin matched all 455 tracked files from that public commit and passed native first use, including full movie decode and playback. The later evidence task began post-install, so it cannot supply the original command output or elapsed time. The recipient still needs Codex desktop, Node 24+, licensed AE 2026 and local AE/macOS permissions.

The public repository now hosts [product](../website/index.md), [support](../website/support.md), [privacy](../website/privacy.md), and [terms](../website/terms.md) pages and a GitHub Issues route. AFT-20, AFT-31, AFT-32, AFT-18 and AFT-34 are Done for their bounded results. The [public install guide](https://github.com/joebenscoter86/after-effects-studio/blob/main/plugin/docs/local-install.md) now reflects the tested pre-release route. AFT-22 finalizes other public materials; AFT-23 reconciles final candidate bytes and claims. AFT-24/AFT-25 handle authorized stable Codex publication and post-release acceptance. Directory work is separate in AFT-30/AFT-35/AFT-36.

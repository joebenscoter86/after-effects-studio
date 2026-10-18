# After Effects Studio

The plugin is free to use for personal and commercial motion work. Joe's original plugin and motion-library materials may not be repackaged or resold; see [the original-material license](license.md) and [source provenance](plugin/PROVENANCE.md). Upstream components keep their separate licenses.

Create and revise editable motion graphics in After Effects with plain-language direction, guided by a detailed production-derived motion language. The latest Codex Git release is v0.2.0; broader public-v1 and OpenAI directory work remain separate.

Open this repository in Codex and describe the work you want to do. [AGENTS.md](AGENTS.md) routes the task to the right workspace.

Public release information: [product](release/website/index.md), [support](release/website/support.md), [privacy](release/website/privacy.md), and [terms](release/website/terms.md). The [installation guide](plugin/docs/local-install.md) gives the public Git marketplace route. The [v0.2.0 Git release](https://github.com/joebenscoter86/after-effects-studio/releases/tag/v0.2.0) is published. A separate-Mac native journey passed for an earlier public-Git candidate; the expanded v0.2.0 system was verified on the development Mac, but a separate-Mac v0.2.0 installation is not yet verified.

- [Product brief](product/brief.md): audience, promise and scope.
- [PRD](product/prd.md): required v1 behavior and acceptance evidence.
- [Roadmap](product/roadmap.md): current work and evidence still needed.
- [Build plan](product/build-plan.md): six stages, exit gates and how to execute work.
- [Backlog](product/backlog.md): ticket specifications and Linear mapping.
- [Plugin](plugin/README.md): package requirements and development instructions.
- [Release criteria](quality/release-criteria.md): what must work before launch.
- [Release plan](release/release-plan.md): distribution and listing preparation.

## Development

The installable package lives in plugin/. Its Node server is already bundled; normal startup does not need npm dependencies. It requires Node.js 24+ and a licensed local After Effects installation. The current runtime has been exercised on macOS with AE 26.5; Windows remains unverified.

For a read-only prerequisite check run `node plugin/scripts/doctor.mjs`. For an offline packaged-server check run `node plugin/tests/smoke.mjs --output quality/reports/local-smoke`. That check does not contact AE. Native testing requires reading the quality context and inspecting the current application state first.

To rebuild, install the locked developer dependencies from plugin/runtime/ with `npm ci --ignore-scripts`, then run `node plugin/scripts/build.mjs` from this root. Runtime typechecking and tests are documented in the plugin README. Keep the bundled runtime/dist/index.js tracked because installed users need it without a build step.

## Repository and installation

This is the canonical public source repository. Its initial import preserves the existing package, library and notices. The previous installed Codex copy is a cache snapshot; future releases should be packaged from plugin/ and refreshed through the supported install workflow. Do not keep editing the earlier prototype directory. The repo's [.agents/plugins/marketplace.json](.agents/plugins/marketplace.json) points a Git-backed Codex marketplace at plugin/. Joe's [separate-Mac acceptance report](https://github.com/joebenscoter86/after-effects-studio/issues/1) records the tested public commit, installed-file match, first-use results and limitations.

Original-material licensing is documented. Candidate review and stable Git publication are complete. Post-release verification and any OpenAI directory submission remain separate tasks. See [product decisions](product/decisions.md) for settled decisions and open questions.

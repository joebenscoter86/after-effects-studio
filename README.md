# After Effects Studio

The plugin is free to use for personal and commercial motion work. Joe's original plugin and motion-library materials may not be repackaged or resold; see [the original-material license](license.md) and [source provenance](plugin/PROVENANCE.md). Upstream components keep their separate licenses.

Create and revise editable motion graphics in After Effects with plain-language direction, guided by a detailed production-derived motion language. Free at launch; full public v1 is in preparation.

Open this repository in Codex and describe the work you want to do. [AGENTS.md](AGENTS.md) routes the task to the right workspace.

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

This is the canonical source repository. Its initial import preserves the existing package, library and notices. The previous installed Codex copy is a cache snapshot; future releases should be packaged from plugin/ and refreshed through Plugin Creator's supported install workflow. Do not keep editing the earlier prototype directory. The repo's [.agents/plugins/marketplace.json](.agents/plugins/marketplace.json) points a future Git-backed Codex marketplace at plugin/; it has not been published or clean-machine installed.

This scaffold creates a local Git repository. Original-material licensing is documented; public hosting, the second-Mac install, directory submission and publication remain release tasks. See product/decisions.md for settled decisions and open questions.

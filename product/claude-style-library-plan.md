# Style library (CL-9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 30 proven Content styles in canonical `plugin/library/styles/`, reached through one `visual-styles` skill and `ae_library`, so Codex and Claude both get them and the Claude package still passes its directory checks.

**Architecture:** A dev-time importer (`plugin/scripts/import-styles.mjs`) copies the selected styles from a Content checkout once, with provenance, into `plugin/library/styles/<id>/`, writes `library/styles/index.json`, and generates the `visual-styles` skill from that index. Remaining Content references are adapted by hand in the plugin copies and listed in the migration notes. `manifest.mjs` indexes the style documents from `index.json`; one `visual-styles` module routes to them. Content is never read at runtime.

**Tech Stack:** Node 24+ ESM, `node:test`, the existing library scripts and tests, Claude Code CLI.

**Spec:** [claude-release-plan.md](claude-release-plan.md) CL-9 (D-015), with the CL-1–CL-4 package from [claude-implementation-plan.md](claude-implementation-plan.md).

## Global Constraints

- Selection: `status: "proven"`, no `generated` pieces, not `study`, not `joeb-house`. On 2026-11-08 that is 30 styles: 16 native, 8 print, 2 painterly, 4 3D.
- Ship per style: `STYLE.md`, its ES3 module, and the files its tools need. Never ship font binaries, font license texts for fonts that are not shipped, `proof/`, or per-style copies of the Lemo-Opuscar license (one copy at `library/styles/LICENSE-lemo-opuscar.txt`).
- Lemo-Opuscar is MIT (Copyright (c) 2026 LemoLab). Its notice appears in `plugin/THIRD-PARTY-NOTICES.txt` and `plugin/PROVENANCE.md`; every imported file gets a `source-map.json` entry with its Content path and sha256.
- No `/Users/<name>/` path, credential, `codex` or `GPT-` text in any imported file (the Claude package checks reject them).
- Dependencies are disclosed, not assumed: Node for every tool, ffmpeg where `needs` lists it, Blender for the four 3D styles (their tools call it but their `needs` omit it).
- The `visual-styles` skill description stays within 1024 characters and names every included style.
- Imported styles carry Content's proof status, labelled as Content's. Plugin-route evidence comes only from Task 5's runs.
- The Claude package stays within 512 files, or the builder records an exception the way CL-2 does.
- No push, publication or submission. Native AE runs follow AGENTS.md: inspect the open project first, own and clean up only named test items, one controller at a time.

## Review Focus

- **A style whose tool silently needs something the user lacks.** The 3D tools call Blender at `/Applications/Blender.app` or `$BLENDER`; a user without it should get a named prerequisite, not a cryptic failure. Pinned by the index's `needs` including `blender` and a test that every tool mentioning Blender is reflected there.
- **A Content-only default left in shipped code.** `glass_scene.py` defaults its clip to a path under the author's home. Pinned by the importer's adaptation report test and a package-wide check for `~/Assets`.
- **Library hash drift after hand adaptation.** Editing a style after the manifest was generated makes `ae_library` reject it. Pinned by regenerating the manifest last and the existing library tests.
- **Skill index out of step with the files.** A style in `index.json` without its files, or the reverse. Pinned by a test that every index entry's `STYLE.md` and module exist and every style folder has an entry.
- **Token cost of listing the library.** About 90 documents in one `ae_library` listing. Pinned by keeping titles short and checking the listing size in Task 2.

---

### Task 1: Style importer and import

**Files:**
- Create: `plugin/scripts/import-styles.mjs`, `plugin/tests/import-styles.test.mjs`
- Create (by running the importer): `plugin/library/styles/<id>/…`, `plugin/library/styles/index.json`, `plugin/library/styles/aes-lib.jsx`, `plugin/library/styles/LICENSE-lemo-opuscar.txt`, `plugin/skills/visual-styles/SKILL.md`
- Modify: `plugin/library/source-map.json`

**Interfaces:**
- Produces: `selectStyles(stylesRoot: string): Promise<object[]>` (parsed `style.json` objects that meet the selection rule, sorted by id).
- Produces: `importStyles({ from: string, to: string, skillDir: string, commit: string }): Promise<{ imported: string[], skipped: {id: string, reason: string}[], files: string[], adaptations: {file: string, line: number, text: string}[] }>`. `to` is the plugin `library/` folder.
- Produces: `library/styles/index.json`: `{ source: {repo: "Content", path: "production/styles", commit}, styles: [{ id, title, tier, summary, triggers, module, moduleGlobal, needs: string[], fonts: [{family, style, license}], tools: string[], contentStatus: "proven", contentProof: <proof date or null> }] }`.
- CLI: `node plugin/scripts/import-styles.mjs --from <Content>/production/styles` (writes into `plugin/`), prints imported, skipped and adaptations.

- [ ] **Step 1: Write failing tests** in `plugin/tests/import-styles.test.mjs` against a fixture styles tree built in a temp dir (four packages: a proven native style with a tool, a proven style with `generated`, a blocked `study`, and `joeb-house`; plus `harness/lib/aes-lib.jsx`):
  - `selects only proven styles without generated pieces`: ids equal `['fixture-native']`.
  - `copies STYLE.md, module and tools, and nothing else`: the imported folder holds exactly `STYLE.md`, the module, `tools/x.mjs`; no `.ttf`, `OFL-*`, `LICENSE-lemo-opuscar.txt` or `proof/`.
  - `index lists needs, adding blender when a tool calls it`: a fixture tool containing `Blender` yields `needs` `['blender','ffmpeg','node']`.
  - `rewrites Content package paths and reports the rest`: a header `// production/styles/fixture-native/tools/x.mjs` becomes `// library/styles/fixture-native/tools/x.mjs`; a line containing `~/Assets/` appears in `adaptations` with its file and line.
  - `refuses a private home path`: a module containing `/Users/someone/` rejects with a message naming the file.
  - `generated skill names every style and fits the limit`: the skill's frontmatter `description` is ≤ 1024 characters and contains each imported title.
- [ ] **Step 2: Run** `node --test plugin/tests/import-styles.test.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `import-styles.mjs`. Rewrites are exact: `production/styles/<id>/` → `library/styles/<id>/`. `adaptations` lists remaining lines matching `~/Assets|production/|harness|prove\.mjs|go\.sh|Higgsfield|JoeB` (case-insensitive JoeB). Skill text comes from a template in the importer: frontmatter (`name: visual-styles`, the description), then the routing instructions and a picker table generated from the index (title, id, tier, what it is good for from `summary`, needs).
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Import for real.** Run the CLI against `/Users/joeb/Projects/Content/production/styles` (record the Content commit). Expected: 30 imported; skipped lists the excluded packages with reasons; adaptations listed.
- [ ] **Step 6: Commit** importer, tests and imported files with `feat(library): import 30 proven styles from the Content style library`.

### Task 2: Adapt, index and route the styles

**Files:**
- Modify: imported `plugin/library/styles/<id>/STYLE.md` and tool files named in the adaptation report
- Modify: `plugin/scripts/manifest.mjs`, `plugin/library/modules.json`, `plugin/library/manifest.json` (regenerated), `plugin/docs/MIGRATION.md`, `plugin/PROVENANCE.md`, `plugin/scripts/build.mjs` (notices), `plugin/tests/smoke.mjs`, `plugin/tests/library-modules.mjs` if it pins counts
- Test: `plugin/tests/import-styles.test.mjs`, existing library tests and smoke

- [ ] **Step 1: Write failing tests.**
  - `every index entry has its files and every folder has an entry` (against the real `plugin/library/styles`).
  - `no shipped style file names a Content-only location`: no `~/Assets`, `prove.mjs` or `go.sh` in `plugin/library/styles/**`.
  - Smoke: `ae_library` lists the new document count and the module ids `['foundation','typography','paper-collage','visual-styles']`; every listed document reads.
- [ ] **Step 2: Run them.** Expected: FAIL (adaptations remain; smoke counts differ).
- [ ] **Step 3: Adapt by hand.** For each adaptation: Content cache paths become "a cache folder you choose (`--cache`)"; harness proof notes become what a plugin user does (render frames and inspect); the `glass_scene.py` clip default becomes required (`--clip`), with a clear error; Higgsfield mentions become "a generator you have, if any". Record each adapted file in `plugin/docs/MIGRATION.md` under a new "Style library import" section.
- [ ] **Step 4: Index and route.** `manifest.mjs` appends, from `library/styles/index.json`: `style-index` (the index, kind `catalog`), `style-lib-jsx` (`styles/aes-lib.jsx`, kind `code`), and per style `style-<id>` (`styles/<id>/STYLE.md`, kind `style`) and `style-<id>-jsx` (module, kind `code`). `modules.json` gains `visual-styles` (kind `style`, entry `style-index`, requires `foundation`, documents `style-index` and `style-lib-jsx`, evidence `not-tested`/`not-reviewed`, `provenanceRefs` the Content commit). `build.mjs` appends the Lemo-Opuscar notice from `library/styles/LICENSE-lemo-opuscar.txt` to `THIRD-PARTY-NOTICES.txt`. Add the source to `PROVENANCE.md`. Regenerate with `node plugin/scripts/build.mjs` (it runs `manifest.mjs`).
- [ ] **Step 5: Update the smoke expectations** to the new document count and module list, and measure the `ae_library` listing size; record it in the ledger.
- [ ] **Step 6: Run** the tests, `node plugin/tests/library-modules.mjs --plugin-root plugin`, the library vitest files in `plugin/runtime` (then rebuild the Codex bundle with `node plugin/scripts/build.mjs`, since vitest's harness overwrites it), and `node plugin/tests/smoke.mjs --output "$TMPDIR/aes-smoke-codex"`. Expected: PASS.
- [ ] **Step 7: Commit** with `feat(library): route the style library through ae_library and visual-styles`.

### Task 3: Claude package with styles

**Files:**
- Modify: `claude/src/README.md`, `claude/src/docs/ARCHITECTURE.md`, `plugin/README.md` and `plugin/docs/ARCHITECTURE.md` (skill and document counts), `release/tests/claude-package.test.mjs`
- Regenerate: `claude/after-effects-studio/`

- [ ] **Step 1: Write failing tests.**
  - `README discloses style tool dependencies`: the Claude README mentions `ffmpeg` and `Blender` in "What it runs and sends" or "Requirements", and lists six skills.
  - `the package ships the style library without fonts`: `library/styles/index.json` exists in the build; no `.ttf`/`.otf` under `library/styles`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Update the docs.** Requirements: optional ffmpeg (most styles' footage tools) and Blender (four 3D styles). What it runs: style tools are Node scripts the agent may run with your permission; they read your input files and write to a cache folder you choose. Example prompts: add "Make this explainer in the woodcut style." Counts: six skills, the new document total.
- [ ] **Step 4: Rebuild** with `node release/build-claude-package.mjs`. Expected: exit 0, file count printed. If over 512, stop and rule (fold or record the exception), then rebuild.
- [ ] **Step 5: Verify.** `node --test 'release/tests/*.test.mjs'`, `claude plugin validate --strict claude/after-effects-studio`, the Claude smoke from the package and from a path with a space. Expected: PASS.
- [ ] **Step 6: Commit** with `feat(claude): package the style library`.

### Task 4: Directory-policy pass on style names and text

**Files:**
- Modify: `quality/reports/2026-11-08-claude-policy-review/report.md` (new section)

- [ ] **Step 1:** Read each included style's title, summary and STYLE.md section 1 against policy sections 1 and 2 and the trademark concern: does any name or text imitate a specific product, brand, franchise or living artist's protected work? Record each verdict.
- [ ] **Step 2:** Rename or reword only where a check fails; rerun the importer's index and skill generation or edit the plugin copy, regenerate the manifest, rebuild both packages.
- [ ] **Step 3: Commit** with `docs: policy review of the style library`.

### Task 5: Sampled proofs through the installed plugin

**Files:**
- Create: `quality/reports/<date>-style-library-proofs/report.md`; renders under `quality/renders/<date>-style-library-proofs/` (ignored)
- Modify: `plugin/library/modules.json` evidence for `visual-styles` and `plugin/library/styles/index.json` per sampled style (`pluginProof`), then regenerate and rebuild

- [ ] **Step 1: Preflight.** Inspect AE read-only (`ae_version_info`, `ae_context`) through the package. If AE has an unrelated open project, keep it: work only in a new, uniquely named comp; never close, clear or save over unrelated work. If AE is not running, or a modal dialog blocks scripting, stop and record it.
- [ ] **Step 2: Pick one style per tier** that needs no clip: native `dark-keynote`, print `paper-lantern`, painterly `midcentury-toon` only if its tool can run on a still, otherwise `rubber-hose` with Content's local test clip; 3D `lowpoly-island` (Node only, plus Blender).
- [ ] **Step 3: For each,** start a fresh `claude -p` session with `--plugin-dir claude/after-effects-studio` and only the plugin's tools allowed. Ask for a five-second scene in that style about a neutral subject in a new named comp, with rendered frames. Record the session's tool calls, the comp name, the frames and any failure. Inspect the frames against the style's STYLE.md yourself.
- [ ] **Step 4: Clean up** each owned comp by ID after the frames are saved, and confirm the project's item count and path match the preflight.
- [ ] **Step 5: Record evidence.** Report with each style's result (Pass/Fail/Unverified per check). Set `visual-styles` evidence `technical` to `passed` only if all sampled builds ran; `visual` stays `not-reviewed` until Joe looks. Regenerate, rebuild both packages, commit with `test: sampled style-library builds through the Claude package`.

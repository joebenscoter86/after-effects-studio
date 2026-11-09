# Claude release plan — approved 2026-11-08

Status: approved by Joe on 2026-11-08, together with the v1 scope and three planning decisions (D-014). Later that day Joe added the style library (CL-9) and a JoeB reel as production acceptance (CL-10) (D-015). Evidence is in [the route research](../quality/reports/2026-11-08-claude-directory-route/research.md). CL-keys below are local planning keys; no Linear tickets exist for them yet. Approval of this plan does not authorize publishing a Claude marketplace, submitting to the directory or accepting directory terms. Each has its own checkpoint.

## Intent

Bring After Effects Studio to Claude users with the same promise as the Codex release: create and revise editable motion in local After Effects, guided by the bundled motion language. Reuse the existing skills, library and native runtime. Distribute first through a self-hosted Claude marketplace in the public repository, then through Anthropic's directory as a community plugin bundle.

## Goals

- One Claude plugin bundle that installs in Claude Code, Cowork and claude.ai from the same folder.
- AE control in Claude Code (the release gate) and, if acceptance passes, in Cowork sessions running on the user's Mac.
- The skills install on every Claude surface. Regular chat gets no AE control and no promised behavior; CL-5 records what actually loads there. No restructuring for chat in v1.
- A package that passes `claude plugin validate --strict` and the directory's blocking checks, with as few reviewer holds as practical.
- Install, first-session, recovery and removal docs written for Claude users.
- Recorded native evidence on Claude, held to the same standard as the Codex reports.
- A visual style library reached through one style skill: the proven Content styles that need no image generator (CL-9).
- A real JoeB reel built with After Effects driven by the installed plugin instead of the Higgsfield bridge, before publication (CL-10).

## Non-goals (v1)

- A hosted relay or remote connector. Regular Claude chat gets skills only (D-014).
- Windows, older AE versions or other hosts beyond those that pass acceptance.
- Billing. The Claude listing is free.
- New showcase films, beyond what acceptance needs.
- Styles that need generated art, the house look (`joeb-house`) and the creator studies (CL-9). Bundled font files.
- Image generation. The plugin generates no art; the user's own tools do.

## Anti-goals

- Forking the craft library or skills into a second maintained copy. `plugin/` stays the single source (D-005); the Claude package is generated from it.
- Breaking the Codex package or its install route, or changing a frozen Codex release candidate.
- Claiming that AE control works in regular chat, or claiming directory approval before Anthropic publishes the listing.
- Hiding anything the plugin runs, writes or sends. The directory security scan rejects undisclosed behavior.
- Using Joe's company-managed Mac (D-011).
- Reading the Content repository at runtime. Styles are copied into `plugin/library` once, with provenance; Content paths stay historical references.
- Changing a reel already in production, or skipping any of Joe's reel approvals, to run CL-10.

## Constraints

- macOS with After Effects 2026, the tested Claude Code build, and a local Cowork session. Advertise only builds that pass.
- Users install Node.js 24+; the nodejs.org installer is the documented route. Plugin servers are not documented to use Claude Desktop's bundled Node, and Claude Desktop may not see a Homebrew or nvm `node`. CL-5 checks what Claude Code and Cowork actually find.
- Source base: build from the head of public `main` when work starts. v0.2.1-rc.3 is in flight on `codex/planning-release-candidate`. Shared `plugin/` changes never land in a frozen Codex candidate.
- Directory rules from the [pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist): `.claude-plugin/plugin.json`; README of at least 40 words; LICENSE; no `.DS_Store`, symlinks, submodules or LFS; server started as plain `node ${CLAUDE_PLUGIN_ROOT}/...`; non-image files under 256 KiB and no more than 512 files (holds); no top-level `bin/`.
- Directory policy: every tool has a `title` and `readOnlyHint` or `destructiveHint`; narrow, accurate tool descriptions; privacy section; at least three example prompts; reasonably current dependencies.
- The original-material license (D-008) permits distribution only from an authorized source. It will be revised to name the Claude sources (Joe's decision 2) before anything is published.
- Some styles prepare footage with Node scripts that need ffmpeg. ffmpeg is an optional prerequisite for those styles only, and the README says which.

## Package shape

The Claude package is a generated folder with this layout:

```
after-effects-studio/
  .claude-plugin/plugin.json
  .mcp.json                 node ${CLAUDE_PLUGIN_ROOT}/start.mjs
  start.mjs                 Node 24 check, then imports the runtime (no "..")
  README.md                 Claude install, what it runs/sends, privacy, prompts
  LICENSE                   original-material terms + pointer to runtime MIT
  PROVENANCE.md, THIRD-PARTY-NOTICES.txt
  skills/  library/  assets/  docs/  examples/
                            (CL-9 adds one style skill and library/styles/)
  runtime/                  readable server build (dist/), vendored node_modules/, LICENSE, jsx/
  scripts/                  doctor, verify-export
```

`plugin.json` carries `name`, `displayName`, `version`, `description`, `author`, `license`, `keywords`, `homepage`, `repository` and the directory fields `icon`, `documentationUrl`, `supportUrl`, `privacyPolicyUrl` and `termsOfServiceUrl`. Those URLs reuse the live pages already in the Codex manifest. The server keeps `AE_MCP_ENABLE_EVAL=1` as today, disclosed in the README.

## Work items

| Key | Outcome | Needs |
|---|---|---|
| CL-1 | Claude package builder | — |
| CL-2 | Readable runtime build within file limits | — |
| CL-3 | Tool and server-instruction policy review | — |
| CL-4 | Claude docs, README, LICENSE and skill wording | CL-1 |
| CL-9 | Visual style library as one style skill | CL-1, CL-2 |
| CL-5 | Local validation and dev-Mac acceptance in Claude Code and Cowork | CL-1–CL-4, CL-9 |
| CL-10 | Production acceptance: a JoeB reel built through the plugin | CL-5, Joe's choice of reel and approval of the Content change |
| CL-6 | Publish the self-hosted Claude marketplace | CL-5, CL-10, settled name, approved license text, Joe's authorization |
| CL-7 | Separate-Mac install and native journey from the public marketplace | CL-6 |
| CL-8 | Directory submission, review and listing verification | CL-7, Joe's authorization |

Keys are stable identifiers; the table and the sections below are in working order. CL-2, CL-3 and CL-9 change shared `plugin/` content. Re-run the Codex runtime tests, library hash checks and smoke checks after them so the Codex package stays good. CL-1–CL-4 have an implementation plan ([claude-implementation-plan.md](claude-implementation-plan.md)); CL-9 and CL-10 get their own when CL-1 and CL-2 have landed.

### CL-1 — Claude package builder

Add a builder next to `release/build-package.py` that copies an allowlist from `plugin/` into a generated Claude folder, writes the Claude manifest, `.mcp.json` and root `start.mjs`, and adds the Claude-only README and docs from the Claude source folder outside `plugin/`. It runs the same library hash checks as the Codex build. It fails if the output contains `.DS_Store`, symlinks, a top-level `bin/`, any lockfile, a `package.json` at the package root (the runtime's own and vendored dependencies' `package.json` files are needed by Node and sit below the root), a non-image file over 256 KiB (unless CL-2 records an accepted exception) or more than 512 files.

Done when: the builder produces the folder reproducibly, its output passes `claude plugin validate --strict`, and a check proves the generated skills and library match `plugin/` byte for byte.

### CL-2 — Readable runtime build within file limits

Replace the single 1.7 MB bundle in the Claude package with a readable build where every file is under 256 KiB, for example compiled modules for the project's own code plus separately bundled dependencies. Keep `npm` installs out of the package; nothing installs at startup.

Done when: the runtime test suite passes; the MCP smoke test passes from the generated folder; no file exceeds 256 KiB. If a dependency cannot fit, record the exception, keep the single bundle, and say so in the submission notes. That is a reviewer hold, not a rejection.

### CL-3 — Tool and server-instruction policy review

All 12 MCP tools already have a `title` and read-only/destructive hints. Native operations, including `eval.run`, project open/close/new and deletes, run through the single `ae_do` tool, which is marked destructive. Keep that design: it matches the upstream runtime and listed precedents such as Affinity's `execute_script`. Do not split operations into separate tools for v1. If a reviewer objects to the generic dispatcher, revisit then.

Review tool descriptions and server instructions against policy section 2: each describes its tool accurately and does not pressure Claude into calls the user didn't ask for. Refresh dependencies and record `npm audit`.

Done when: an automated test lists every registered tool with its title and hints; the review notes and any wording changes are recorded; runtime tests pass.

### CL-4 — Claude docs, README, LICENSE and skill wording

- **README:** 40+ words; requirements (macOS, AE 2026, Node 24 on PATH); where AE control works (Claude Code, plus local Cowork only if CL-5 passes it) and where it doesn't (regular chat); everything the plugin runs, reads, writes and sends; how to disable writes (`AE_MCP_READONLY=1`) or custom scripting (`AE_MCP_ENABLE_EVAL=0`); a privacy section; at least three example prompts.
- **Docs:** Claude versions of install, first session, connection recovery and removal: Claude Code CLI and Customize → Plugins, marketplace add and update, and uninstall.
- **Skills and library:** in canonical `plugin/`, replace the GPT model guidance in `motion-studio/SKILL.md` and `library/references/quality.md` with wording that names no specific host until there is Claude evidence. Regenerate the library manifest. This ships to Codex in its next version.
- **License:** draft the revised original-material license (decision 2) for Joe's approval. The package `LICENSE` carries the approved text and points to the runtime's MIT license and the third-party notices.

Done when: the docs match the actually tested commands, and no Codex-only command or model claim remains in the Claude package.

### CL-9 — Visual style library as one style skill

Bring the proven styles from Content's style library (`production/styles/`) into canonical `plugin/library/styles/`, so Codex and Claude both get them. 43 of its styles are ports of the MIT-licensed [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) collection; paper collage is original and already in the plugin. Content's `harness/export.mjs` is the starting point: it writes a plugin bundle with one skill per style and has never been merged here.

- **Scope for v1:** the 30 proven ported styles whose `style.json` lists no generated pieces: 16 native, 8 print, 2 painterly and 4 3D. The 13 ported styles that need generated art, `joeb-house` (needs Joe's rig) and the blocked `study-greg` and `study-kallaway` stay out.
- **One style skill:** its description names the styles; its body is the picker (each style's id, what it is good for, tier and needs). It loads one style's notes only when that style is chosen. The existing `paper-collage` skill stays and the style skill lists it.
- **Per style:** `STYLE.md` (grammar, AE recipe, gotchas) and its ES3 module, served through `ae_library` and the library manifest like the existing modules. The modules build Content's seven-beat test scene, so the docs present them as worked examples, not general builders. A style's preprocessing script ships only when the style needs it; the README discloses each one and its ffmpeg need.
- **No font files.** Each style names its free font family, where to get it and a fallback, matching the plugin's existing rule.
- **Rights and provenance:** Lemo-Opuscar's MIT notice goes into `THIRD-PARTY-NOTICES.txt` and `PROVENANCE.md`; `source-map.json` records every imported file. Review the style names and descriptions against the directory policy (for example any that evoke a product or brand) and record it with the CL-3 notes.
- **Proof:** in a fresh Claude Code session using the installed package, build one style per tier (native, print, painterly, 3D) from a blank project and inspect the rendered frames. The other styles keep Content's proof status, labeled as Content's.
- **File limit:** the Claude package stays within 512 files. If it cannot, the builder records the exception the way CL-2 does, and the submission notes expect a reviewer hold.

Done when: the styles and the style skill are in `plugin/` with a regenerated library manifest; the sampled builds have reports under `quality/reports/`; Codex runtime tests and library hash checks pass; and the Claude package build passes its checks.

### CL-5 — Local validation and dev-Mac acceptance

On the development Mac, load the generated folder in Claude Code with `--plugin-dir` and through a local marketplace, then in a local Cowork session. Record the macOS Automation prompt as it appears, the missing-Node behavior, read-only context check, a create, a revision and an export. Use the existing report template. Run the canonical `plugin/evals/` prompts with `claude plugin eval` against a no-plugin baseline.

Done when: reports exist under `quality/reports/` for Claude Code and Cowork, with each check marked Pass, Fail or Unverified. Claude Code must pass; the Cowork result decides what the README claims for Cowork. Joe's creative acceptance is recorded separately from technical results.

### CL-10 — Production acceptance: a JoeB reel built through the plugin

**Checkpoint:** Joe chooses the reel and approves the change in the Content repository.

Build a real JoeB house reel from its Stage 7 build through the fix pass, master and cover, with After Effects driven by the installed Claude package instead of the Higgsfield bridge. Today Content's `house/run.sh` sends each build through the Higgsfield bridge proxy, which stops waiting after 33 seconds; `ae_do` takes a per-call timeout. This tests AE control under real production load. It does not test the plugin's own motion library, because a house reel's craft comes from Content, so it adds to CL-5 and CL-7 rather than replacing them.

- **Content change, on a Content branch:** a `go.sh` mode that writes the assembled build script to a file instead of sending it. Claude runs that file through `ae_do` `eval.run` as `$.evalFile(<path>)` with a raised timeout, so roughly 330 KB of house code never passes through the conversation. Opening or switching projects goes through the catalog's `project.open`, never inside the script. Reels already in production finish on the route they started on.
- **One controller:** the Higgsfield bridge MCP is turned off and its proxy stopped for the session. Inspect the open AE project before writes and never close unrelated work. Higgsfield and Blender keep making the boards and art; the plugin generates nothing.
- **Install:** the package validated in CL-5, through a local marketplace, not the development folder.
- **Gates:** Joe's reel approvals run exactly as the reel pipeline defines them.
- **Record:** per stage, what ran through the plugin; every failure, timeout or fallback; build times beside recent builds on the Higgsfield route; and Joe's acceptance separately from technical results. Use the report template.

Done when: a report under `quality/reports/` records the reel. Pass means Joe accepted the master and every After Effects operation from Stage 7 on went through the plugin. Any fallback to the Higgsfield route is a Fail with its cause, fixed before CL-6.

### CL-6 — Publish the self-hosted Claude marketplace

**Checkpoint:** Joe authorizes this exact public change.

Add `.claude-plugin/marketplace.json` at the repository root pointing at the generated Claude package, beside the existing Codex catalog. Publish to the public repository.

Done when: `claude plugin marketplace add joebenscoter86/after-effects-studio` and an install succeed from a clean Claude Code config, and Customize → Plugins → Add marketplace finds the plugin.

### CL-7 — Separate-Mac acceptance

On a personally owned or explicitly authorized separate Mac (D-011), install from the public marketplace. Run the read-only check, create, revise and export in Claude Code, plus a short Cowork run.

Done when: a redacted report records exact builds and results.

### CL-8 — Directory submission

**Checkpoint:** Joe authorizes the submission and accepts the [directory terms](https://support.claude.com/en/articles/13145338-anthropic-software-directory-terms), including the indemnity and removal clauses.

In the portal, choose Plugin bundle, the repository, the package path and a tracked tag. Run Validate and answer the data-handling questions from the README. Complete compliance with a monitored contact email and a channel for vulnerability reports. Submit and track the review, answering reviewer holds with the CL-2 and CL-3 notes.

Done when: the listing is live, it installs from the directory on a clean Claude Code config and in Customize → Plugins, and a report records the exact listed version.

## Progress (2026-11-08, after the After Effects session)

- **CL-1 to CL-4: built and reviewed.** Generated package `claude/after-effects-studio/` (503 files with the styles) passes `claude plugin validate --strict` and the release tests; a whole-branch review's Important findings are fixed. The License 1.1 text waits for Joe in [license-1.1-draft.md](license-1.1-draft.md); `license.md` stays 1.0.
- **CL-9: Tasks 1–4 done** ([claude-style-library-plan.md](claude-style-library-plan.md)): 30 styles imported, routed through `ae_library` and the `visual-styles` skill, packaged, and policy-reviewed. A second whole-branch review's Critical and Important findings are fixed (the 3D tools no longer need unshipped fonts; fonts, scene limits and proof labels are stated truthfully; discovery prefers the running After Effects). Task 5 ran ([report](../quality/reports/2026-11-08-style-library-proofs/report.md)): `dark-keynote`, `paper-lantern`, `midcentury-toon` and `lowpoly-island` were each built as a new five-second scene through the package's server on After Effects 27.0x78 and checked against their STYLE.md; their `pluginProof` and the module's technical evidence are recorded, visual review waits for Joe. The runs drove the server directly because the CLI login has expired, so a fresh session choosing the skill is still unverified. They found one skill gap, now fixed: `buildScene` carries the test scene's own captions and pacing.
- **CL-5: partial** ([report](../quality/reports/2026-11-08-claude-local-validation/report.md)). A Git-clone marketplace install, uninstall, server starts, a read-only live check, and a native create, revision and export on After Effects 27.0x78 pass. Found and fixed: the runtime could not find After Effects 2027. Still open: the eval run, the skill-triggering check and Cowork (all need the CLI login), and the Automation prompt wording.
- **Waiting on Joe:** a refreshed Claude Code CLI login (`claude auth login`) for headless sessions and `claude plugin eval`, a look at the four style contact sheets, the License 1.1 text, the plugin name, and which After Effects versions to advertise.

## Joe's decisions (2026-11-08)

1. **Shared source changes are allowed.** Changes useful to both Codex and Claude, such as rewording the GPT model guidance in `motion-studio/SKILL.md` and `library/references/quality.md` (with the library manifest regenerated), or policy-driven tool and server-instruction wording, go into canonical `plugin/`. They reach Codex users in the next Codex version after its normal tests, never in a frozen candidate. Claude-only files, such as the manifest, MCP config, README and Claude install docs, live in a Claude source folder outside `plugin/` and are built into the package.
2. **The license will name its authorized sources.** Revise the original-material license (D-008) to name the public repository and its marketplaces, the Anthropic directory, and organization admins distributing unmodified copies to their own members. The repository `license.md` and `plugin/license.md` stay one text. Joe approves the exact wording before CL-6.
3. **Claude Code is the release gate.** If AE control fails or is impractical in local Cowork, release anyway, saying Cowork gets the skills only, and revisit Cowork later.
4. **The style library becomes skills** (added after plan approval, D-015). Content's proven styles ship in the plugin (CL-9).
5. **A JoeB reel is the final test before publication** (added after plan approval, D-015). A real reel is built with After Effects driven by the plugin instead of the Higgsfield bridge (CL-10).

## Still open for Joe

1. **Plugin name.** `after-effects-studio` will likely be held as a brand match for Adobe. Keep it and explain the descriptive use to the reviewer, or choose a distinct slug while keeping "After Effects Studio" as the display name (D-009). Settle it before CL-4 finalizes docs; renaming after CL-6 breaks existing installs.
2. **Marketplace publication** at CL-6.
3. **Directory submission and terms** at CL-8, plus the monitored contact email and the paid Claude account or organization that submits as JB Technology LLC.
4. **The CL-10 reel** and approval of the `go.sh` change on a Content branch.

## Calls made in planning

These are planning calls by Claude, not Joe's decisions. Check them while reading.

- Regular chat is out of scope beyond installing the skills (follows D-014).
- `ae_do` stays one destructive dispatcher; no tool split for v1.
- Node 24+ from the nodejs.org installer is the documented prerequisite.
- Work starts from the head of public `main` and never edits a frozen Codex candidate.
- The name must be settled before CL-4 docs are final.
- One style skill instead of one skill per style: one description in every session instead of 30, and a single place to pick a style. `paper-collage` keeps its own skill.
- v1 styles are the 30 that need no image generator; the generator-dependent ones wait for a later version.
- No font files ship with the styles; each names its free font and a fallback.
- One style per tier is proved through the installed plugin; the rest carry Content's proof status, labeled as Content's.
- CL-9 comes before CL-5, so CL-5 validates the package that ships.
- CL-10 replaces only AE control; generation stays on Higgsfield and Blender. It gates CL-6, so a production failure is found before publication.

## Calls left to the builder

- The generated folder's location: a committed folder on `main` checked for drift, or a dedicated release branch. Either works with the marketplace and portal, which take a path and branch or tag.
- The exact CL-2 technique, provided files stay readable and nothing installs at startup.
- Whether to add a `userConfig` toggle for custom scripting. Any such option needs a default, or Cowork ignores the server.

# AFT-7 installed fresh-session acceptance — 2026-10-07

Publication copy: one developer home path was redacted on 2026-10-09; [the redaction manifest](../2026-10-09-public-source-redaction/manifest.json) identifies the original and public file hashes. All other recorded results are unchanged.

Result: **Pass for AFT-7's local fresh-task journey, with a documented color-easing workaround.** The installed plugin's own MCP attached to this new Codex chat, connected to the exact empty unsaved AE project, built an editable scene, rendered previews, revised it in place, and verified the revised state. This closes the prior attachment blocker for this candidate on this development Mac. It does not establish a clean second-machine/public install, novice usability, full-speed playback, or public v1 readiness.

## Candidate and environment

- Scenario Q-01; AFT-7/B-07; R-01 and R-02. Operator: fresh Codex agent, developer-machine acceptance. User requested continuation after the package's MCP-path fix and reinstallation.
- Date: 2026-10-07, America/Los_Angeles; native JSON exports at 12:41:50 and 12:42:18 PDT; host/install evidence captured at 12:42:58 PDT. The folder suffix is a unique run identifier.
- Source revision: `e8b58fd58955866a1da7f31d11c9407947a5fc57`, with extensive pre-existing modified/untracked work. This run added only its own report/evidence directory and ignored renders; it did not modify implementation, other reports, or the installed cache.
- Installed candidate: `0.1.0+codex.20261007193805`, located at `<developer-home>/.codex/plugins/cache/personal/after-effects-studio/0.1.0+codex.20261007193805/`.
- Installed-tree SHA-256: `f390e6c46bd155aee8f6661b755a548cc70af73ba405077d68cc21207c24e206` (450 files). Method: sorted recursive file paths; SHA-256 over UTF-8 lines containing each file SHA-256, two spaces, relative POSIX path, newline. Full file list in [package-fingerprint.json](package-fingerprint.json). This is a tree fingerprint, not an archive hash.
- Host: macOS 26.6.2 (25G83), Node 25.9.0. Desktop host /Applications/ChatGPT.app reports 26.928.40906 (12694), with Codex framework 154.0.8037.57 observed in process paths. Live AE: 26.5x89, build 89, en_US.
- `codex mcp get after-effects-studio`: enabled stdio server, `node ./scripts/start.mjs`, cwd resolves to the exact installed candidate. Source and installed manifest identify the same version. Unlike the previous broken candidate, the source MCP configuration uses package-relative paths.
- Installation itself was completed by the preceding task using the documented `codex plugin add after-effects-studio@personal` step. This chat verified the resolved registration, candidate bytes, installed doctor from /tmp, and actual tool attachment; it did not reinstall again or claim an independent installation.
- Callable inventory contains the plugin's `ae_catalog`, `ae_version_info`, `ae_context`, `ae_do`, and `ae_render_frame`. Every native call in this run used `mcp__after_effects_studio`. No Higgsfield or manually launched MCP client was used.

## Preflight and ownership

The initial and immediately pre-write version/context inspections agree: file=null (untitled/unsaved), dirty=true, zero items, 16-bit project, no active composition or selection. Existing unsaved work was treated as real project state; no clear, close, switch or project save occurred.

One controller was used sequentially in this chat. Other third-party CEP processes were present; process presence does not show that they were issuing writes. No external controller was invoked, and readbacks showed only this run's expected changes. Exclusive inactivity of all external processes cannot be proven from these observations.

The guide was [plugin/docs/first-session.md](../../../plugin/docs/first-session.md), with local-install.md, Q-01, quality criteria and local ae-control/motion-review/motion-studio skills. Craft guidance came from the installed `ae_library`: motion-language, production-workflow, brief-template, construction, type-evidence, scripting, quality and failure-atlas. No private repo, personal rig, paid media service, external assets or custom font was required.

The [portable brief](brief.md) defines exact copy, dimensions, timing, ownership and revision. The agent supplied ordinary geometric test content within the authorized acceptance scope. This was not an independently observed novice following prompts.

## Executed journey

| Step | Action and result |
|---|---|
| Install discovery | Required plugin tools found; installed doctor passed from /tmp; registered cwd and version verified. No developer dependency install, source build or manual configuration was required in this chat. |
| Connect and inspect | Plugin ae_version_info and ae_context succeeded before writes. Live connection and later PNG/JSON writes demonstrate operational permissions. No new permission-grant interaction was observed; denial/recovery was not tested here. |
| Brief | Five-second 1920 × 1080, 30 fps geometric alignment scene. Charcoal, warm white and mint; ArialMT/Arial-BoldMT verified via font.list. |
| Create | comp.create created `AFT7_INSTALLED_1945_ALIGNMENT`, ID 25. A 48-operation batch created native text/shapes, animation and readback. Nine layers, no footage or rig. |
| Inspect warning | Read back middle bar ID 43 after color easing warned. Color keys existed as linear; position/rotation keys had intended Bezier easing. Reapplied only the two color keys explicitly linear; returned without warnings. No creation batch was replayed. |
| Preview | Exported before-project.json; rendered six before frames at 0, 0.5, 1.15, 1.6, 2.25 and 4.5s. Visually inspected contact sheet and 1920 × 1080 hold frame. |
| Revise | Stable ID 39 headline: “Make room for clarity” → “Bring every part into focus”. Stable ID 43 final color key: mint → orange [1, 0.48, 0.23, 1], at unchanged 2.25s. Same comp ID 25; no duplicate. |
| Verify | Exported after-project.json; rendered/inspected the same six times and full-resolution hold. Recursive JSON comparison finds only export timestamp, headline (two serialized locations) and final color key RGB. All IDs, other layers, dimensions, key times/easing and other properties match. |
| Final state | Left owned comp ID 25 open at 4.5s, nine layers, one project item. Project remains untitled/unsaved, dirty=true. No cleanup or AEP save; editable native work is available for inspection. |

Native layer IDs: background 37; eyebrow 38; title 39; subtitle 40; baseline 41; bars 42/43/44; caption 45.

## Visual findings and checks

| Dimension | Result | Evidence and limits |
|---|---|---|
| Installed MCP attachment and live connection | Pass | Required tools callable in fresh chat; AE version/context successful. |
| Editable native structure | Pass | One comp, four text layers, five shape layers; position, rotation, scale, opacity and color keys. |
| Current project preservation | Pass for this empty unsaved case | File remains null, only owned comp added, no save/switch/close/clear. Existing-content cases remain separate AFT-10 evidence. |
| Meaningful revision/readback | Pass | Same comp and layer IDs; exact expected JSON differences only. |
| Rendered samples / type and edges | Pass for this modest geometric brief | Both sheets and full-size holds show clear title hierarchy, intact ground, crisp rounded bars, no visible clipping/collision or duplicate objects in sampled motion. Longer revised headline fits without shrinking. |
| Visual limitations | Recorded | Small secondary type is subordinate and readable at native size, but not optimized for mobile. Scene is a simple engineering illustration, not a public creative showcase. |
| Color handling | Pass for workingSpace=None | Native direct captures, 16-bit values converted unchanged to 8-bit sRGB-tagged PNG. No color warning. Numerical full-frame coverage=1; uniform dark margins are intentional ground, not black bars. |
| Full-speed playback / pacing / audio | Unperformed | Sampled frames do not establish rhythm. No movie, audio or playback review in this scoped AFT-7 run. |
| AEP reopen / movie delivery | Unperformed | Native comp remains editable but unsaved. Separate AFT-12 delivery scope. |
| Clean machine / public install / novice usability | Unperformed | Development Mac and existing personal marketplace. AFT-18 remains separate. |
| Joe's creative acceptance | Unverified | No user taste approval inferred from technical success or inspected stills. |

## Warning, correction and remaining limits

The initial color keyframe.apply requested ease interpolation. Both color keys returned:

> After Effects error: Unable to call “setTemporalEaseAtKey” because of parameter 2. Value array does not have 1 elements. (line 866)

The batch reported zero failed operations but nested warnings. Readback verified a COLOR property with two linear keys. The smallest scene-level correction explicitly reapplied the same keys as linear; it succeeded without warnings. Position/rotation easing remained valid. This is an unresolved runtime color-easing defect, not a clean warning-free original build; no implementation fix is claimed. It did not prevent the guided create/preview/revise/readback outcome.

Earlier missing-MCP evidence remains valid for its older candidate; this report does not overwrite it. Public distribution, second-machine proof, complete visual examples, full-speed review and editable file delivery remain release gates. AFT-11 is not closed by this sampled-frame test.

## Evidence

- [tool-evidence.json](tool-evidence.json): required tool provenance, pre-write state, complete build/revision arguments and returns, font query, nested warning/readback and frame results.
- [host-install-evidence.json](host-install-evidence.json), [package-fingerprint.json](package-fingerprint.json), [working-tree-status.txt](working-tree-status.txt).
- [revision-diff.json](revision-diff.json): complete before/after JSON differences.
- [final-context.json](final-context.json): one owned comp and unchanged unsaved project status.
- [artifact-hashes.json](artifact-hashes.json): sizes/hashes of all 16 generated artifacts.
- Ignored heavy evidence: `quality/renders/2026-10-07-installed-first-session-1945/`: before/after-project.json; before_0.png through before_5.png; after_0.png through after_5.png; before_sheet.png and after_sheet.png.

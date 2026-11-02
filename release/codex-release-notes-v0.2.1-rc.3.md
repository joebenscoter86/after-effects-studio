# After Effects Studio v0.2.1-rc.3 — release candidate

Prepared locally for review; not tagged or published. Stable remains v0.2.0.

This candidate includes the brief-to-motion planning improvement: a creator-readable story proposal plus a separate construction-ready plan covering proposed copy, frame timing, assets/fonts, persistent objects, difficult handoffs and review targets. It retains the five skills and 29-document motion foundation. Reference-video style transfer remains separate work.

RC.3 also corrects project reopening. Previously, suppressed native dialogs could implicitly save current edits even when project.open requested no save. The corrected operation validates target existence first and explicitly discards before opening; save=true still saves deliberately, and nonempty untitled work requires a path before that save. A refused close stops the open. Opening remains a project replacement, so permission and ownership inspection still apply.

Verification: six regression tests; offline runtime suite 516 passed/four skipped; both type checks; focused style checks; disposable native old/fixed same-file, different-file, missing-target, untitled, requested-save and queue cases. A copy of the accepted lock study's observed post-failure project survives full render/reopen with its hash, 40 serialized layer states and six native frames preserved. The six same-pipeline samples also match prior delivery frames. The original accepted V2 bytes are unavailable; the failed RC.2 study remains recorded, and this is a parent engineering retest, not a fresh unassisted RC.3 film evaluation. Joe accepted the disclosed revalidated replacement handoff on 2026-11-02.

Two reproducible 67-file builds; extracted and installed-cache MCP smoke; every installed byte matched the ZIP. Temporary installation removed. Supported initial target remains Codex desktop on macOS, licensed local AE 2026 and Node 24+. Other platforms/AE versions and a separate-Mac RC.3 run are unverified. Original-material terms and upstream notices are unchanged. OpenAI directory eligibility/submission is separate.

Version: `0.2.1-rc.3+codex.20261102`. Local archive: `after-effects-studio-0.2.1-rc.3+codex.20261102.zip`, SHA-256 `db30edab27a20b292ecea2843f24f4f7c00f9fdca088ccfb124a1e0e4ea37ae3`. Proposed tag if later authorized: `v0.2.1-rc.3`. Pinned candidate installation is separate from the unpinned stable marketplace.

# AFT-32 — proposed public infrastructure action sheet

Status: **Joe approved rights, license terms and the reviewed source content on 2026-10-13; the public action still needs separate authorization**. No public repository, pages or support route has been created. AFT-31's [source-rights report](../../quality/reports/2026-10-13-source-rights-review/report.md) holds the exact previously approved ZIP hash. The four `release/website/` pages were then changed only to replace local-draft wording with bounded pre-release wording and planned support links. Review that delta and the rebuilt manifest together before any public action.

## Exact proposed action

Create one **public** GitHub repository named `joebenscoter86/after-effects-studio` under Joe's authenticated account. Import only the reviewed source ZIP contents as a **new initial commit**, preserving the canonical development checkout and its existing private one-commit history. The fresh import avoids two old developer-home paths still present in that original commit. Keep the root `.agents/plugins/marketplace.json` pointing at `./plugin` so the source can later be installed as a Codex marketplace. Publish the repository's product, support, privacy and terms Markdown from `release/website/`, with `license.md`, `plugin/license.md`, `plugin/runtime/LICENSE`, `plugin/THIRD-PARTY-NOTICES.txt` and `plugin/PROVENANCE.md` intact.

Enable GitHub Issues for ordinary support. Enable GitHub private vulnerability reporting for security/privacy incidents, confirm notifications reach Joe as the JB Technology LLC maintainer, and check the reporter entry point. The local-copy retention and deletion procedure is in `release/submission/security-route.md`. No custom domain, paid support email, organization transfer, OpenAI upload or stable-release announcement is part of this action.

**Exposure:** a public repository makes the entire imported source, marketplace catalog, scripts, skills, library, reports and included images downloadable before an announced stable release. The catalog may allow users to install a development plugin before AFT-23/AFT-24 release approval. Public copy must clearly say release preparation and tested scope; do not claim a directory listing or stable launch. The ignored AEPs, movies, raw reports and generated ARC 01 input are not in the review ZIP.

## Preconditions and verification

1. Joe's rights, license and source-content confirmation for the original AFT-31 ZIP is recorded in the linked report. Review the subsequent four-page publication-copy delta and rebuilt manifest. A scanner pass alone is insufficient.
2. Recheck GitHub account/repository availability. Compare the proposed import tree file-by-file with the reviewed manifest before setting visibility to public; publish no existing development Git history.
3. Obtain explicit authorization for this **specific** public repository/pages/support publication after the current snapshot hash and content are stable. Planning approval is not that authorization.
4. After publication, record the public commit SHA and independently open the repository, marketplace catalog, product, support, privacy, terms and license/notices URLs as a logged-out visitor. Verify Issues and private-report entry points without posting sensitive test content. Only then put actual working URLs in metadata.
5. If the public content is wrong, disable marketplace exposure by removing or correcting its catalog entry in a new public commit and update the pages. Repository visibility can be changed, but published Git data may already have been copied; visibility reversal is not an erasure guarantee. Treat a credential/privacy exposure as an incident under the private-report procedure.

This action establishes distribution infrastructure only. AFT-34 tests install from the actual public source; AFT-22 finalizes claims/links; AFT-23 reviews a frozen candidate; AFT-24 later requires its own stable-release authorization. AFT-30 OpenAI outreach is separately authorized and independent.

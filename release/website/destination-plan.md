# Public identity and link plan for AFT-20/AFT-32

D-013 (2026-10-13): AFT-20 closes on reviewed publisher/support ownership and publication-ready page content; it does not need live URLs. AFT-31 reviews exact source/rights and AFT-32 obtains specific infrastructure-publication authorization, publishes the reviewed source/pages, then verifies actual URLs and private support intake. AFT-22/AFT-34 finalize materials and prove the public install route before AFT-23 stable-release review. This ordering avoids a live-link/publication dependency cycle.

JB Technology LLC is the selected publisher and developer identity (D-009). After Effects Studio is the final product name. Joe's original-material license still names him as copyright holder; publisher identity does not silently assign that copyright to the LLC. Joe selected his existing `joebenscoter86` GitHub account for the public repository and its Issues as the initial support intake.

The authenticated GitHub login was verified as `joebenscoter86` during preparation. A lookup for `joebenscoter86/after-effects-studio` found no repository, and this workspace has no Git remote. No public repository, domain or support page is configured. Do not put a guessed or currently nonresolving URL into the plugin manifest or listing.

Use the eventual public Git repository under `joebenscoter86` as the durable home: a project landing/installation page, Issues as the support intake, and versioned privacy and terms pages in the repository. A custom domain and dedicated support email can be added later without making them launch prerequisites. Verify that the actual repository and page URLs resolve and that JB Technology LLC controls the support intake before inserting them into metadata. Draft page content can be prepared locally before publication.

| Required destination | Planned content | Release verification |
|---|---|---|
| Product website | What the plugin does, supported host/AE/Node versions, install instructions, real demos | Exact published URL opens and matches tested candidate |
| Support | Issue intake, troubleshooting links, security/contact escalation | Test a report path and confirm LLC access/ownership |
| Privacy | Local data flow, project/media access, optional external asset tools, any actual telemetry | Text matches implementation and published URL opens |
| Terms | Original-material license, upstream notices, usage and support scope | AFT-31 specific rights/custom-license review and published URL opens |

Local page drafts are `index.md`, `support.md`, `privacy.md` and `terms.md`. The privacy draft is based on the candidate's local stdio/IPC architecture and source inspection; it does not assume that the agent host, GitHub or optional external asset services share the plugin's data practices. OpenAI's [submission field reference](https://developers.openai.com/plugins/deploy/submission) requires HTTPS website, support, privacy and terms URLs for an attached MCP public-review listing, and its [plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines) call for collection, purpose, recipients, retention and user-control disclosures. Those are public-review requirements; this draft Git marketplace plan still needs live links before any listing claim. A private incident contact and support-report retention procedure remain to be selected.

The source repo now contains a local [Git marketplace catalog](../../.agents/plugins/marketplace.json), with its unverified public-install steps in [the route draft](../submission/git-marketplace-route.md). The [private incident route](../submission/security-route.md) now names Joe as triage owner and defines local-copy retention and correction requests; it still needs activation and notification verification on the published repository. The [source-tree audit](../submission/public-repo-audit.md) remains a separate gate. That catalog does not create a public repository or a working URL.

No account purchase, domain registration, public repository creation, or page publication is authorized by this plan.

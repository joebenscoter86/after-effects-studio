# After Effects Studio — public v1 release

## Approved execution revision — D-013 (2026-10-13)

The detailed current contract is [release-execution-plan.md](../product/release-execution-plan.md). Replace natural-timeout waiting with AFT-9's controlled uncertainty test; AFT-18 starts independently. AFT-20 prepares reviewed publisher/page content, AFT-31 closes concrete source/asset/license questions, and AFT-32 publishes reviewed infrastructure only after specific authorization. This necessarily exposes source/catalog before a stable launch and must be disclosed in its action sheet. AFT-33 validates update/removal/rollback; AFT-34 rehearses actual public Git installation. AFT-23 freezes the final candidate and reruns affected scenarios, AFT-24 publishes the authorized stable Codex release, and AFT-25 verifies it. OpenAI route confirmation (AFT-30), route-specific preparation (AFT-35) and authorized submission/publication (AFT-36) form a separate nonblocking track. Existing stage/research prose below is context, not authority to restore superseded dependencies.

Status: release preparation. No public repository, upload, outreach, payment setup or listing has been created. After Effects Studio is the chosen product name; JB Technology LLC is the publisher. Joe wants a full public release. Launch price: free; monetization deferred. D-006 selects a public Git-backed Codex marketplace with guided install; D-007 selects local Codex desktop on macOS with AE 2026 as the initial v1 target. AFT-3's current-source review and route comparison are in [the local-controller brief](submission/local-controller-brief.md). Exact version claims still require candidate evidence.

## Product promise

Create and revise editable motion graphics in After Effects using plain-language direction, guided by a production-derived motion language. The user chooses the subject and visual style; the plugin supplies choreography, native implementation and visual review. The bundled knowledge is the core product capability. Adobe After Effects and a supported agent application remain prerequisites.

Target users: creators and small creative teams who need polished explanatory motion and want to retain editable AE compositions. First-session success means creating a useful scene, seeing a preview and making a meaningful revision without the developer's repository or personal setup.

## What exists

- Local native AE controller, operation discovery, scripting, frame capture and reusable helpers.
- Three skills and 19 verified bundled knowledge/code resources, including detailed construction, camera, typography, continuity, worked scenes and failure lessons.
- The latest local candidate passed 413 offline runtime tests (116 skipped), unpacked and installed-cache MCP/library smoke, and a bounded native render-completion control on the development Mac. These results describe runtime testing, not motion quality or a clean-machine release pass.
- Fresh-context agents consulted only the packaged knowledge. Their generated scene required native scripting corrections; a corrected copy rendered 15 inspection frames. Original outputs and failure logs are retained.

The full-release work is onboarding, reliable production, distribution and presentation. “Premium” should be demonstrated by actual results in multiple styles rather than implied by passing code tests.

## Distribution route

The initial public route is a Git-backed Codex marketplace with guided installation, as selected in D-006. The universal directory remains a separate desired route. The current package launches a local Node process because AE runs on the customer's computer. OpenAI's current guidance says local/application-access plugins need an OpenAI contact or product-specific review; ordinary hosted MCP submission expects a public endpoint. A hosted endpoint alone cannot reach a customer's local AE.

Prepare a short technical brief for OpenAI that covers the local bridge, installation, permissions, local file handling, render outputs and included knowledge. Confirm the supported local distribution route before investing in a cloud relay or claiming directory availability. If a companion service is required, define authenticated device pairing and explicitly scoped local access before implementation. No connection is to be exposed publicly as a shortcut.

A Git-backed public marketplace can distribute the current local architecture independently. It is not a substitute claim that the plugin is in OpenAI's directory. The public install path and a second-machine run remain unverified.

Source: https://developers.openai.com/plugins/guides/submit-claude-plugin
Source: https://developers.openai.com/plugins/build/plugins

## v1 work and completion evidence

| Workstream | Required result | Evidence needed |
|---|---|---|
| First use | Guide a new user through supported AE, runtime and scripting/Automation setup with clear recovery messages | Installation on a second Mac with no Content checkout, cached plugin or preconfigured Node assumed; first comp created and revised |
| Supported platform | Publish the exact tested OS/AE combination | Start from the verified macOS/AE26.5 environment; extend claims only after tests on the other versions/platforms |
| Creation | Three finished, materially different examples: type-led identity, causal explainer and product sequence using supplied legitimate artwork | Editable project, complete playable export, rendered QA and provenance for each; supplied art clearly identified |
| Revision | Change copy, palette, pacing and framing in an existing scene while preserving approved material | Before/after project and video evidence; no duplicate scene fragments or unrelated changes |
| Reliability | Handle blank project, existing unsaved project, absent fonts/media, host closed/busy and uncertain completion | Recoverable errors and verified preservation of unrelated project content; no blind rerun after a timeout |
| Motion quality | Apply the language to a difficult transition and ordinary explanatory beat in each style | Actual playback and close inspection, including readability, overlap, continuity and final holds |
| Delivery | Save an editable project with referenced assets and export a complete video | Open the delivered AEP, verify links, inspect video metadata and full decode, verify delivered copy |
| Public package | Reproducible release with notices, documented requirements, real icons/screenshots and release notes | Validate final ZIP/manifests; no personal paths, private materials, credentials or developer-only logs |
| Listing/support | Product page, support route, accurate data-flow description, privacy/terms pages and reviewer materials | Working public links, verified publisher identity, real demonstrations and submission checks |

A full v1 may have an explicit supported-platform scope. Universal refers to users and adaptable visual language; it must not imply every operating system, AE version, plugin effect or media source has been tested.

## Package audit findings

The earlier read-only audit is recorded in ../quality/reports/package-audit.json. All 19 library hashes matched at that audit. It reported eight unresolved release-preparation checks, including original-material licensing. D-008 and the repository/package license files now resolve the policy choice; the audit itself must be rerun against the candidate. Final metadata/assets and verified public links remain release work; directory-specific field and MCP requirements are conditional on AFT-30's confirmed route and are handled in AFT-35. The public listing requirements come from the submission documentation; licensing is a separate product decision, not a claim that OpenAI mandates an open-source license.

Source: https://developers.openai.com/plugins/deploy/submission

## Market evidence and positioning

The available plugin search returned no result for “After Effects.” Its results are not exhaustive. ImagineArt's public listing does include an After Effects skill and says relevant application access/integration is required. We have not assessed that skill's ability to control AE. “First,” “only,” or “no competitors” is unverified.

Position around the demonstrable experience: native editable AE work, a detailed motion language that adapts to the user's style, deliberate revision and rendered review. Existing public AE controllers mean tool access alone is easy to compare; the craft system, outcome quality and onboarding are where this product must prove value.

Evidence: https://chatgpt.com/plugins/plugin_asdk_app_6a97af93ebc88191961039f177688fa9?locale=en-US

## Confirmed commercial scope

Free public launch. Defer billing, subscriptions, license-key enforcement and paid feature segmentation. Keep the complete motion foundation available in v1. Existing Adobe and agent-app requirements remain explicit. If the distribution route requires authenticated device pairing, explain that connection separately from pricing.

## Decisions still needed

- Concrete AFT-31 source ownership, custom-license boundaries, dependency/upstream notices and demo-asset review, escalating only specific unresolved legal questions. D-008 resolved the policy choice; no payment system or plugin-specific account is needed for the launch.
- Verified public repository/page and support links. D-009 settles the After Effects Studio name, JB Technology LLC publisher, `joebenscoter86` GitHub home and Issues support choice; exact live links remain open until publication.
- Confirmed public-directory path for a local AE integration, if directory listing is later pursued.
- Access to a genuinely clean, personally owned or expressly authorized second Mac for installation verification. D-011 excludes Joe's company-managed Mac. Joe may operate an eligible machine; no outside technical tester is required. Other build and release-preparation work continues while this gate is open.

## Execution order

1. Complete and verify Codex-first onboarding and packaging. Pursue local-plugin directory guidance separately, without making its answer a Codex launch dependency.
2. Produce and verify the three complete examples plus revision/recovery cases.
3. Complete clean-machine testing, final legal/asset review and public-facing materials.
4. Prepare a concrete release package and demonstration for the chosen Codex route; pursue directory submission only after its requirements are confirmed.
5. Publish the approved release and use the same verified demonstrations for launch.

This plan does not authorize sending messages to third parties. It records the work needed for the requested release and separates completed evidence from external dependencies.

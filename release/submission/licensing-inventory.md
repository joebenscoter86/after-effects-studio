# AFT-19 licensing inventory and decision brief

Prepared 2026-10-06; updated after Joe selected choice B. This is the release inventory; the actual grant is in [the repository license](../../license.md) and [the installable package license](../../plugin/license.md). No public repository or listing exists yet. D-008 records free creator and commercial-output use while reserving standalone redistribution of Joe's original materials.

## What is in the proposed package

| Material | Current provenance and terms | Release action |
|---|---|---|
| `plugin/runtime/` native controller base | Derived from kumo.productions/mcp-aftereffects 0.3.1 at the commit in [PROVENANCE](../../plugin/PROVENANCE.md). Upstream `runtime/LICENSE` is MIT. Original changes to that base must not erase or misstate upstream rights. | Preserve upstream MIT notice and map any Joe-authored additions clearly. |
| Bundled Node dependencies in `runtime/dist/index.js` | `THIRD-PARTY-NOTICES.txt` contains the upstream runtime and eight bundled package notices: MCP SDK, Ajv, Ajv formats, fast-deep-equal, fast-uri, json-schema-traverse, Zod and zod-to-json-schema. Their included notices contain MIT, BSD-style and ISC terms. | Rebuild and audit notices against the exact candidate dependency graph; ship the notice file. |
| Motion library: 19 indexed documents and JSX helpers in `plugin/library/` | Adapted from Joe's Content production work plus original package writing. [source-map.json](../../plugin/library/source-map.json) records historical source hashes; the original repository is not shipped as a runtime dependency. D-008 and `plugin/license.md` govern Joe's original additions. | Verify the final package includes the grant and provenance without implying private-source availability. |
| Three plugin skills, packaging scripts, examples, README, screenshots and original glue | Joe's original additions are covered by `plugin/license.md`. `plugin/PROVENANCE.md` maps the two contact sheets to this project's native test scenes. Current visual inspection found text and shapes without imported art, footage, logos or private content. | Verify the exact candidate bytes and font/platform requirements before release; avoid granting rights Joe does not control. |
| Adobe After Effects and user-provided fonts, media, product artwork | Not bundled. Users need their own AE license and rights to their inputs. | Do not imply these assets ship or are sublicensed by the plugin. |

The repo and installable package now contain explicit original-material terms alongside `plugin/runtime/LICENSE` and `plugin/THIRD-PARTY-NOTICES.txt`. GitHub's [repository licensing guide](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) explains why an explicit grant matters for a public source repository. OpenAI's [plugin packaging guide](https://developers.openai.com/plugins/build/plugins) documents Git-backed marketplace sources; selecting a marketplace does not choose rights for original material. The plugin's free price is separate from these rights.

## Decision and alternatives considered

| Choice | Creator use and commercial output | Redistribution/repackaging of Joe's original plugin/library | Trade-off |
|---|---|---|---|
| A. Permissive open source for original material (for example, MIT) | Clearly permitted; users can customize and contribute easily | Permitted, including resale if notice terms are followed | Simplest public-source story and broadest reuse; gives up control over repackaging the craft library. The existing MIT runtime stays under its own upstream notice. |
| B. Free-to-use, source-available original material | Grant installation, running and use for personal **and client/commercial motion output**; allow modification needed for own use | Withhold public redistribution, repackaging and sale of Joe's original additions | Closest to “free to create with, but don't resell the plugin/library.” Needs clear custom terms, path boundaries and review so public Git installation, updates and user-created output are not accidentally restricted. Upstream MIT portions cannot be relabeled as restricted. |
| C. Split terms | Give permissive rights to Joe-authored connector/glue and free creator use of craft library | Connector may be forked/resold; library redistribution can be restricted | Encourages code contributions while protecting the production language, but requires more per-file license mapping and careful treatment of built artifacts/examples. |

Joe selected **B**. D-008 and the two license files apply that policy. The grant expressly covers commercial *outputs*, normal plugin installation/updates, private modification and editable AE handoffs. It excludes standalone resale/repackaging of Joe's original materials. The final custom text still needs legal review before publication; candidate asset bytes need a final check. [Creative Commons recommends software-specific licenses](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software), so no Creative Commons content license was placed over the executable package.

## Remaining release checks

1. Audit source ownership and screenshots; separate upstream, Joe original and user-supplied material in the release payload. Verify dependency notices after rebuilding the exact candidate.
2. Validate the final package and listing against the license; obtain legal/asset review under AFT-21/AFT-23 before publication. The manifest has no standard SPDX identifier for this custom grant, so the license is carried as a document rather than mislabeled as MIT.
3. Keep publication and directory submission separately authorized.

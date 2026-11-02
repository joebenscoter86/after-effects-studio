# AFT-54 — exact installed-candidate planning tests

Status: all bounded installed-candidate planning checks passed; ready for human review and merge authorization. This is a planning-only check of PR #6, not a native motion or public-release result. Joe's 2026-11-02 request to keep going resumes the previously proposed temporary install and remaining planning checks.

## Candidate and installation

- Source snapshot: `679b7adde790ad965db61996ef4b656e43cd33b4` in the isolated `codex/brief-to-motion-m4` worktree. The canonical root's unrelated changes remain untouched.
- Prepared archive: `release/packages/aft54-install-candidate-v3.zip`, SHA-256 `42be5d722ded2d5b7a7be3ce573ea1c06efa3522570f1407daf2318103fe82fd`, 67 files, manifest version `0.2.1-rc.1+aft54.20261023`.
- [Supported CLI install](https://learn.chatgpt.com/docs/developer-commands#codex-plugin): temporary local marketplace `aft54-local-test`, separate from `jb-technology`. The tested cache was `/Users/joeb/.codex/plugins/cache/aft54-local-test/after-effects-studio/0.2.1-rc.1+aft54.20261023`.
- [Installed identity](installed-identity.json): all 67 cache files exactly match the ZIP, with no extra files. The skill SHA-256 is `d9092644ebd81ba1fb2978052331f5429a1114c5fcf7cdeeda314b9bdf1d5849`.
- Offline smoke against that installed cache passed handshake, 29 hashed library document reads, three module routes, traversal rejection and the offline policy-filtered catalog. See [smoke results](offline-smoke/smoke-report.json).

An initial install from the old staging folder failed archive identity: it copied the development tree, including extra files and a different `runtime/package.json`. That cache was removed through the supported CLI; the marketplace was replaced with a fresh extraction of the reviewed ZIP. [Rejected identity](rejected-source-stage-identity.json) preserves the failed check. No behavioral test used that installation.

## Frozen evaluation and environment

The [frozen cases and review criteria](frozen-cases.json) were written before the first successful model run. They cover the original library-book brief, an unfamiliar relay-baton brief, a meaningful scripted creator correction, and an essential-missing-assets brief. Each turn is capped at ten minutes and 60 tool calls. [Runner](run-installed-eval.py) preserves the first answer, runtime metadata and raw trace hash.

Evaluators run in separate empty temporary directories with memory disabled, unrelated plugins disabled, a read-only command sandbox, no delegation and no access authorized to development checkouts, previous answers, reports or evaluation files. They discover/read the installed candidate and its bundled library; no expected answer or scoring criteria are provided. The source worktree is used by the operator to launch and score, not as evaluator input. The correction resumes only its own first-turn session. These tests explicitly prohibit AE inspection as well as mutation; connection-dependent checks are deferred rather than weakening that boundary.

The saved user model alias `gpt-6-sol` was rejected before any tool use. The evaluator therefore excludes the stale user configuration for this invocation, retains authentication, and uses the runtime default. All successful turns selected `gpt-6-astra`, with reasoning effort left at the runtime default (recorded as null); exact session model/settings are recorded per turn. This is not a controlled comparison with October's models/settings. Quoted CLI override keys also caused a configuration-load failure before a model ran. After excluding user config, disabled-server-only overrides lacked transport definitions and failed configuration loading; those unnecessary overrides were removed. Setup failures are not scored as skill behavior. The operator corrected a library-check invocation that initially printed usage; the correctly parameterized 29-document check passed. No persistent user model or unrelated server configuration was edited.

## Results

| Case | Outcome | Evidence |
| --- | --- | --- |
| Library-book first answer | Pass, planning scope | [Answer](library-book-first-answer.md), [run identity](library-book-first-run.json) |
| Relay-baton first answer | Pass, unfamiliar-subject transfer | [Answer](relay-baton-first-answer.md), [run identity](relay-baton-first-run.json) |
| Meaningful relay correction | Pass, scripted correction in its own session | [Answer](relay-baton-correction-answer.md), [run identity](relay-baton-correction-run.json) |
| Missing essential product assets | Pass, faithful build explicitly blocked | [Answer](missing-assets-first-answer.md), [run identity](missing-assets-first-run.json) |

The library-book answer supplies separate story and construction sections, proposed wording, a landscape/viewing rationale, a 30 fps / 300-frame timebase with exclusive ends, native editable art, a proposed font, action/settle/reading spans, one persistent book, departure/contact/scan-before-confirmation events, and seam-neighbor checks. It defines two seconds of readable final hold. A new named composition is proposed rather than assuming an existing owned project. Font availability and the actual visual result remain unverified, correctly deferred because the test prohibits AE inspection.

The relay first answer transfers that behavior to a phone-format sports diagram: 1080×1920 / 30 fps / 270 frames, exact copy and layout zones, editable rigs, one persistent baton, contact at F105, shared support through F111, release at F112, empty-hand separation at F113, and adjacent-frame review targets. The follow-up changes the duration to 360 frames, expands the shared grip to F150–185, makes release/separation visible at F186–209 and starts carry-away only at F210. It updates the final reading hold to four seconds while retaining the visual direction and takeaway. This is a meaningful planned revision, not just an appended pacing note. The correction was frozen by the operator before testing; it is not a new creative acceptance from Joe and has not been executed in AE.

The first answers leave routine native-build decisions such as final font availability, exact illustrative rig geometry and measured rendered text fit for later execution. Those are not represented as verified assets or completed motion. The planning checks assess whether an agent has enough concrete direction to proceed within the proposed design, not whether the unbuilt film already meets a premium creative bar.

The perfume negative case explicitly blocks a faithful build until actual bottle imagery, exact label/logo and custom font arrive. It offers a conditional static-photograph reveal, refuses to infer unseen sides or generate generic branding, adds no invented slogan, and labels timing and portrait format as proposed defaults. It correctly keeps the supplied label attached to the bottle photograph. Those provisional choices do not establish faithful execution or product readiness.

Manual inspection of the [command trace audit](trace-audit.json) found only reads/listing of the installed candidate's skill and library. The correction made zero tool calls. No evaluator read memory, previous-session material, the development tree, reports or eval files; no native, web, asset-generation, write or publication tool was invoked. Three fresh sessions plus the same-session correction took 265.16 seconds in successful model runs and 13 tool calls. These figures exclude setup, operator scoring and packaging; they are not a measured creator-to-finished-film time.

Canonical repeatable prompts now live in `plugin/evals/evals.json`: existing eval 15 for the book, eval 16 for relay plus its scripted follow-up, and eval 17 for missing assets. The dated frozen inputs preserve what was used before results existed. Adding those evaluation records and this evidence does not change the tested skill or any distributable payload bytes; eval files and quality reports are excluded from the plugin archive. No additional playbook rules were needed in this continuation.

## Boundaries and disposition

Static skill validation, all 17 unique evaluation IDs, 29-document library validation, installed offline smoke, and the four behavioral checks have passed. The post-test cache still matched the archive exactly. The supported CLI then removed the temporary plugin and marketplace; [cleanup verification](cleanup-verification.json) confirms the candidate cache is absent and stable `after-effects-studio@jb-technology` at `0.2.0+codex.20261018` remains enabled.

The observed planning gap is repaired on this exact installed candidate for two subjects, one revision and one asset-dependent refusal. That bounded evidence supports moving PR #6 out of draft. AFT-54 remains In Progress pending Joe's review/merge decision; no AE execution, rendered motion, new creative acceptance, stable-version update, public release or directory submission is established by this report. The next product proof should exercise an unfamiliar creator brief through approved plan, native AE build, AE scrubbing, meaningful late edit and editable delivery using a versioned release of this guidance. That requires its own actual creative and release decisions rather than treating these planning passes as a finished-film acceptance.

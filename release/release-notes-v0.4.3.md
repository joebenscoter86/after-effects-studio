# After Effects Studio and Comp Room v0.4.3

The technique cookbook grows from 57 proven techniques to 85. `ae_arsenal` now returns 28 more recipes for explainer work: numbers, charts, steps, maps and calls to action. Each was built in After Effects from the recipe alone and accepted on review. With them come 28 more technique stills (76 in all).

- **28 more proven recipes** from three explainer tutorials (cookbook pieces 1 to 3, accepted 2026-11-21):
  - **Land a number:** a counter driven by one slider on a control null, a ring that fills to the counter's value, an icon that fills up to a value, and a value label that rises one word at a time.
  - **Compare and show proof:** round-capped bars that grow to their own values, a ladder of thick-stroke bars with value labels sliding in beside them, a chart baseline that draws outward from its middle, and a pie chart made from one fat stroke with its share pushed out.
  - **Step through a process:** a two-colour phase bar that draws on segment by segment, labels that rise out of their own bar segment, step pictures that pop in one after another with a small bounce, and a small swept-head arrow that draws itself between steps.
  - **Point at a detail:** map regions that fade up one by one, ink-blend place highlights with a self-drawing border on a grey map, pinned instant photos swaying on a map, and a tap cursor built from two translucent discs.
  - **Call to action:** a pill button built in its own comp, a headline, button and web address stacked on a white square, card elements that slide in from the left one after another, a cursor that glides in and taps the button, and a curved, eased cursor route in and out.
  - **Also:** a soft coloured lift under a button with an inset label; card elements sliding out to the right in the same cascade; a cut mid-move to a close-up carried by a shared upward drift; a faint graph-paper backdrop, and a faint grid held inside a chart's box with the chart stepped to 12 fps; stepped jitter with black-and-white photos for a hand-made finish; and a photo pyramid that dips, then splits into tiers to reveal labels.
- **For the repository:** the channel learner runs through `tools/channel-learner/run-stage.mjs`. It makes one fresh run per recipe per stage, and each stage names its model: Sonnet everywhere except the look review, which runs on Opus. Each run has a turn and dollar cap, and each video has a budget.

**Changes existing users will notice:**
- `ae_arsenal find` returns more candidates for the explainer jobs (land a number, compare, step through a process, point at a detail, call to action, show proof).
- No server, tool or operation changed. The runtime is the same as in 0.4.2.

**Where it was built and checked.** The recipes were proven in Claude, through Comp Room, on the development Mac. No Codex session has run them. The Codex package carries the same library.

**Verification for this release:**
- **The proven recipes:** each of the 28 new ones was built live in After Effects 2027 on the development Mac, from the recipe alone, compared with the tutorial's result and accepted on review.
- **Packaging:** `node release/build-claude-package.mjs --check` reports the package up to date; the release tests, the channel-learner tests and `claude plugin validate` for the marketplace and the package.
- **Not run for this release:** the evals, a separate-Mac install, any Codex session, and Windows.

Install Comp Room in Claude Code, or update it:

```text
claude plugin marketplace add joebenscoter86/after-effects-studio
claude plugin install comp-room@jb-technology

claude plugin marketplace update jb-technology
claude plugin update comp-room@jb-technology
```

Install or update After Effects Studio in Codex:

```text
codex plugin marketplace add joebenscoter86/after-effects-studio
codex plugin marketplace upgrade jb-technology
codex plugin add after-effects-studio@jb-technology
```

Start a new session after installing. See the [Comp Room README](https://github.com/joebenscoter86/after-effects-studio/blob/main/claude/comp-room/README.md) and the [Codex installation and permissions guide](https://github.com/joebenscoter86/after-effects-studio/blob/main/plugin/docs/local-install.md).

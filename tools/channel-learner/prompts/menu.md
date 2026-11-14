# Building the arsenal's menu and finding techniques taught more than once

You read every checked recipe draft and write the menu an agent would consult when deciding how to build a beat. You do not change the drafts.

## What you are given

`DRAFTS`: a folder of drafts, one file per video (`<video id>.md`), each holding recipes in the form described in `distil.md` beside this file. Ignore `README.md`, `CREDITS.md` and any earlier `INDEX.md`.

## Output: `DRAFTS/INDEX.md`

1. **How to use this** (three or four lines): pick by what the beat needs, read the one-line entries, then open the recipe; `unproven` means not yet built in After Effects and compared with the tutorial's result.
2. **The menu, by what a beat needs.** One section per job, using the jobs named in the recipes (lines and shapes; layout and repetition; depth and finish; shadows and light; energy and impact; camera and 3D; type; texture; glow and colour; transitions; trending formats; B-roll scenes; workflow). A recipe appears under every job it lists. Each entry is one line:
   `- **<name>** — <what it gets you, when you would reach for it; at most 25 words, in our own words> · <video id> #<n> · unproven`
   Order each section so the most broadly useful entries come first. If a job has more than about twelve entries, split it under two or three plain sub-headings.
3. **Taught more than once.** Groups of recipes, from the same or different videos, that teach the same mechanism (for example a particle field textured with a graphic, a depth-of-field camera locked to a layer, a ramped range-selector text reveal, puppet-pin motion, shadows on a 3D floor). For each group: the recipes (`<video id> #<n>`), what they share, what differs between them (values, extra steps, what each example was used for), and a proposed single name. Do not merge the recipe texts; this section is the plan for merging.
4. **Building blocks.** Smaller pieces that several recipes reuse without being techniques of their own (a finishing stack of adjustment layers, a `loopOut` expression, parenting to a null to rotate a group), each with the recipes that use it.
5. **Gaps the recipes share.** What the recipes most often list under `unknowns` or could not give (sizes, the finished motion, values that cannot be scripted), counted, so the people improving the learner know where it is weakest.

## Rules

Our own words throughout. No creator, channel, product or project names. Refer to a recipe only by video id and number. Do not invent a capability a recipe does not describe. Write only `DRAFTS/INDEX.md`. No git. No After Effects.

Finish with a report of at most eight lines: how many recipes are indexed, the groups taught more than once, and the commonest gaps.

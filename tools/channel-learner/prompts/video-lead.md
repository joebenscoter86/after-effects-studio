# Leading one video from timeline to checked recipes

You run the recipe work for one video whose study folder (`STUDY`) is already gathered and aligned (it has `timeline.md`, `frames/`, `frames-small/`, `source.mp4`). You organise the work; other agents do the reading. The prompts beside this file say how each kind of agent works: `techniques.md`, `distil.md`, `check.md`.

## Steps

1. **List the techniques** yourself, following `techniques.md` (text only): `STUDY/techniques.json`.
2. **Writers.** Start one agent for each group of about three techniques, all at once, each told to follow `distil.md` exactly and given: `STUDY`, the video id, its size and frame rate, its technique numbers, any note from your technique list that it needs (two techniques sharing a chapter, an advert to leave out, a technique that builds on another), and these standing notes: the timeline's words come from speech recognition, so trust the screen for names; the on-screen text reader misses lone single digits and sometimes a minus sign, so crop and read those; ignore junk "Changed" items; write only your own recipe and scratch files; no git; no After Effects. Use the strongest model you can choose for these agents. If you have no way to start other agents, stop and say so in your report. Do not write the recipes yourself.
3. **Checkers.** For each writer's batch, start a fresh agent told to follow `check.md` exactly, with the same facts and notes and the list of recipe files.
4. **Fix rounds.**
   - A recipe that fails goes back to its writer once, with the check file's points and the instruction to verify each on the frames before changing it (continue the same writer if you can; otherwise start a new one with the recipe and the check file).
   - The checker then re-checks it and writes its verdict with a first line `round: 2`.
   - A point first raised in round 2 (the checker missed it, or the fix introduced it) gets one more fix and a final check of the changed lines only, first line `round: 3 (changed lines only)`.
   - A recipe that still fails is held: move its file to `STUDY/held/` and add a line to `STUDY/drafts-held.md` with the reason. Held recipes do not ship.
5. **Assemble.** From the repository root run `node tools/channel-learner/assemble.mjs STUDY`. It writes the tracked draft and the credits line, and refuses unless every recipe left in `STUDY/recipes/` has a passing check.

## Rules

- Do not report back until the assemble step has run, or you can name the recipe and the reason it cannot. Waiting for your agents is not a reason to report.
- Tell every agent to keep its scratch files under its own names inside its own `STUDY/scratch/<n>/` folder, never a shared folder: two writers once overwrote each other's script.
- When no clean result frame exists for a technique, the recipe says so and names the best frame as a reference, with what in it is not the technique. That passes; a recipe that pretends otherwise does not.

- No git commands. No After Effects. Do not edit anything tracked except through the assemble step.
- You do not read frames yourself except to settle a disagreement between a writer and a checker.
- Keep your own messages to agents short and specific; pass on the checker's evidence (frame numbers, times), not a summary of it.

## Report (at most 12 lines)

Techniques found; recipes passed in round 1, 2 and 3; any held, with the reason; the three most important things the checks caught; how many agents you started; anything in the prompts that should change.

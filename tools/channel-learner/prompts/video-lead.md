# Leading one video from timeline to checked recipes

You lead the recipe work for one video whose study folder (`STUDY`) is already gathered and aligned (it has `timeline.md`, `frames/`, `frames-small/`, `source.mp4`). The work itself is done by the runner, `tools/channel-learner/run-stage.mjs`: it starts one fresh headless run per technique per stage, following `techniques.md`, `distil.md` and `check.md` beside this file, each on the model its table names, with a turn limit and a dollar cap per run and a budget for the whole video. You start it, follow its results file, and report. You do not start agents yourself and you do not hold the work in your own context.

## Steps

1. **Preview** (starts nothing): `node tools/channel-learner/run-stage.mjs video --study STUDY --dry-run`.
2. **Run** it in the background, from the repository root: `node tools/channel-learner/run-stage.mjs video --study STUDY` (add `--budget-usd <n>` only if the owner set a different limit). It does, in order:
   - lists the techniques (`STUDY/techniques.json`) if there is no list yet;
   - one writer run per technique, then one checker run per recipe (round 1);
   - **fix rounds**: a recipe that fails its check goes to a fresh writer run with the check file and the instruction to verify each point on the frames before changing it; a fresh checker run then re-checks it (`round: 2`); a recipe that fails round 2 gets one more fix and a final check of the changed lines only (`round: 3 (changed lines only)`);
   - holds a recipe that still fails: moves it to `STUDY/held/` with a line in `STUDY/drafts-held.md`. Held recipes do not ship;
   - runs `node tools/channel-learner/assemble.mjs STUDY`.
   A run that hits its turn limit, its own dollar cap or its time limit is recorded as a fail with that reason and is not tried again in the same go. Past the video's budget the runner starts nothing more and prints where it stopped.
3. **Follow** `STUDY/runs.jsonl` only: one line per run with the stage, technique, model, pass or fail, a short note, cost, turns and peak context. `node tools/channel-learner/run-stage.mjs spent --study STUDY` totals it. Open a recipe or a check file only to settle a disagreement between a writer and a checker, and frames only for that.
4. To run one stage again for chosen techniques: `node tools/channel-learner/run-stage.mjs <stage> --study STUDY --only 04,07`. Never resume or message a finished run: start a fresh one.

## Rules

- When no clean result frame exists for a technique, the recipe says so and names the best frame as a reference, with what in it is not the technique. That passes; a recipe that pretends otherwise does not.
- No git commands. No After Effects. Do not edit anything tracked except through the assemble step.
- Do not report back until the runner has finished or stopped, or you can name the recipe and the reason it cannot.

## Report (at most 12 lines)

Techniques found; recipes passed in round 1, 2 and 3; any held, with the reason; the three most important things the checks caught (from the check files of failed rounds); the video's cost from `spent`; any run that hit a limit; anything in the prompts that should change.

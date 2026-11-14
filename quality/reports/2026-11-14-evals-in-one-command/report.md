# 2026-11-14: the evals through `claude plugin eval`, a stage switched off, and a blind test in one command

**What this covers:**
- Professional-finish stage 10, on branch `adobe/pro-finish-stage-10`.
- Reading library documents in parts, which this stage's runs showed was needed, on `adobe/pro-finish-library-parts`.
- Every run used Claude Code 2.1.322 and After Effects 27.0, on an empty 8 bpc scratch project with no working space.
- **Built:**
  - the eval suite writer's fixes;
  - five new cases;
  - `release/eval-switch.mjs`: the package against a copy with one stage switched off;
  - `quality/blind/blind.mjs`: a blind comparison of two movies.

## The cases, by stage

| Stage | Case | Score as run, one run unless stated |
|---|---|---|
| 1, the whole-piece check | 21 `finish` (picture) | 1.00 |
| 2, a second pair of eyes | 22 `review` (picture) | 0.67 |
| 4, sitting an element in its scene | 24 `seat` (picture) | 0.88 on rerun |
| 6, reading motion and sound | 26 `curve` (picture, new) | 0.86 |
| 9, hand-over and delivery | 28 (planning, new) | 1.00 |
| 11, the user's own look | 25 (planning) | 1.00 |
| 12, the one-click cut-out | 23 (planning) | 0.36, then 0.61 over 3 runs once documents could be read in parts |
| 13, tearing down a reference | 29 (planning, new) | 1.00 |
| 14, the pixel headline style | 30 (planning, new) | 0.14, then 0.57 over 2 runs with parts |
| real footage | 27 `footage` (picture, new), on a user's own green-screen take handed by an environment variable | 0.88 on rerun |
| 3, 5, 5b, 7 | none | 3 is read in the plans of 25 and 29. 5 and 5b are inside `subject.soften_edge`, which no read-only answer exercises. 7 needs a colour-managed or risky project that no case builds. |

**The footage case:**
- The clip never enters the repository or the suite's committed files.
- The plate's truth (grain and edge width in its stillest blocks) is measured from the clip with ffmpeg when the suite is written.
- Without the variable the case is skipped with a message.

Each new case was seen to fail once:
- 26, on bad findings offline;
- 27, on a clean element and on a changed plate, offline on a drawn clip;
- 28, 29 and 30, with their own stage switched off.

## Both sets

**Planning set:** 22 cases, 587 s, $7.40.

| Score | Cases |
|---|---|
| 1.0 | 02, 04, 06, 09, 12, 13, 14, 25, 28, 29 |
| 0.8 to 0.86 | 01, 03, 10, 15, 16, 17 |
| 0.33, 0.25 | 05, 08: an explicitly invoked skill is injected, so no SKILL.md read or Skill call shows, as on 2026-11-08 |
| 0.40 | 11: a continuation case one prompt cannot meet |
| 0.36 | 23 |
| 0.14 | 30 |

Cases 23 and 30 failed because their sessions could not read the 93 KB keying guide and the 69 KB style document (see "Library parts").

**Picture set:** 8 cases, 922 s, $5.60, the most for one case $1.38.

| Case | As run | Kept renders graded again | Rerun on the final build |
|---|---|---|---|
| 18 keying | 0.17 | 8 of 8 checks | 0.83, every check passes |
| 19 grade | 0.30 | 6 of 6 | 0.90 |
| 20 over | 0.25 | 2 of 2 | 1.00 |
| 21 finish | 1.00 | | |
| 22 review | 0.67 | | |
| 24 seat | 0.50 | 4 of 4 | 0.88 |
| 26 curve | 0.86 | | |
| 27 footage | 0.50 | 4 of 4 | 0.88 |

The five render cases failed as run on a grader fault. `ae_render_frame` names its files `<stem>_<call id>_<index>.png`, with a new id every call, while the grader still looked for `<stem>_<index>.png`. The tool's naming changed under the evals without them being run.

**Judged assertions that failed on the reruns** (the runner records the judges' votes, not their reasons; the readings are from each run's transcript; no assertion was changed):

| Case | Assertion | Votes | Reading |
|---|---|---|---|
| 18 | the screen measured on the un-keyed source before the key's Screen Colour was set | pass, fail, fail | the judge's: it measured first |
| 18 | the report lists changes with edge numbers before and after, and says which results were checked by numbers and which by looking | pass, fail, fail | the session's: no split between numbers and looking |
| 19 | the final render made as the plan printed it, after the last grading change, then one grade | fail, fail, fail | likely the judge's: the order is as asked |
| 22 | the findings ranked … with no score or pass or fail verdict | fail, fail, fail | the case's: the prompt has the session run the grader, and its answer opens with the grader's pass |
| 24, 27 | `look` on both regions over two consecutive frames before the first change | fail ×3; fail, fail, pass | the judge's: the first call was exactly that |

## Switched off

`node release/eval-switch.mjs --off <stage>` builds a plain copy of the package and a copy with one stage off, writes the same suite into both, runs both and prints the scores side by side. It switches a stage off three ways:
- **grant:** a tool withheld;
- **category:** the copy's own server allows every operation category but the stage's;
- **text:** the stage's files removed or its passages cut between exact markers, with the copy's library manifest re-hashed.

"Checks" in the table are the graders that need no model judge.

| Stage off | Case | Checks, plain → off | Judged, plain → off | Score, plain → off | Turns, time, cost |
|---|---|---|---|---|---|
| 9 (its guidance) | 28 | 3/3 → 1/3 | 4/4 → 1/4 | 1.00 → 0.29 | 8 → 9 turns |
| 13 | 29 | 3/3 → 2/3 | 3/4 → 1/4 | 0.86 → 0.43 | 7 → 14 turns |
| 12 (3 runs an arm, with parts) | 23 | 9/15 → 3/15 | 11/18 → 4/18 | 0.61 → 0.21 | |
| 14 (2 runs an arm, with parts) | 30 | 4/6 → 2/6 | 4/8 → 0/8 | 0.57 → 0.14 | |
| 11 (3 runs an arm) | 25 | 3/3 → 3/3 | 18/18 → 17/18 | 1.00 → 0.95 | |
| 1 | 21 | 5/5 → 5/5 | 3/3 → 3/3 | 1.00 → 1.00 | 8 → 18 turns, 85 → 145 s, $0.59 → $2.23 |
| 6 | 26 | 4/4 → 4/4 | 3/3 → 3/3 | 1.00 → 1.00 | |

**Four stages move the score.**
- Stages 1 and 6 do not on these cases: the cases name what to look for on clean synthetic defects, so a session gets there with lower-level tools. Stage 1 then costs 3.8 times as much.
- Stage 7, and stage 9's operations, cannot be switched off this way: they share the `project` and `render` categories with everything else.
- Stages 5 and 5b cannot be switched off at all: they live inside one operation.

## Assertions and graders changed after a case failed

| Case | Before | After | Why |
|---|---|---|---|
| 25 | "… does not invent fonts or type sizes the sheet does not hold" | "… does not claim fonts or type sizes from the sheet, which holds none (a font proposed as a default for the user to confirm is not a claim)" | The session said the sheet holds no fonts and proposed a default for the user to correct; the judge failed it on "invent". |
| 21, 22, 26 | "no write operation on the setup's items after the setup ran" | the same, plus "(ae_check_comp sets a comp's resolution for its captures and puts it back; that is not a change)" | The check's own temporary resolution change was taken for a change. |
| 21, 22, 26 | the prompt: write the findings file, then grade | hand the findings to the grader as one JSON argument; bad JSON is refused without grading | A picture case is granted only read tools and the grader, so it could not write a file. |
| 18 to 27 | a "plugin skill fired" indicator on every picture case | only where the prompt asks for a skill | Scored in a one-arm run. |
| 18, 19, 20, 24, 27 | the grader read `<stem>_<index>.png` | it reads `<stem>_<call id>_<index>.png`, the newest call | The render tool's naming changed. |
| 23 | answer checks `subject-check-first` and `subject-file-first` required the operation names (`subject.check` with "before anything else is built"; `subject.render_cutout`, then `subject.check_file`, then `subject.use_cutout`) | each accepts the operation's name or its plain description, and still requires the order: the check of the cut-out with a hole or what is missing shown, then a render or build step after it (or "before anything else is built" beside `subject.check`); "render the cut-out once / to a file", then "check every frame of the file", with no building on the file in between | The plans say it in the plain words the skill tells them to use with a user: "I check the cut-out around the frame you clicked. If any part of you is missing or there are holes, I'll tell you right away and show you the picture." Then "I render the cut-out to a file … Then I check every frame of that file, and I build the piece on the file". |
| 23 (on the reruns) | the plain words above | also "check holes / openings" as the check, and "what's out / anything is out" beside a picture as the hole shown ("out" counts only beside "picture": click step 7, which every plan quotes, says "show you what is in and what is out") | Two reruns said it in other words: "**Quick check.** I check the cut-out and show you a picture of what's in and what's out. If anything is missing, I tell you straight away"; "Check holes and openings near the click frame. I'll tell you immediately if anything is out, with a picture." |
| 30 | `pixel-builders` required `heroWord` and `pixelBlocks` by name | also accepts the style's all-in-one builder named as code (`beat(comp, brief)` or `` `beat` ``); the plain word "beat" does not count | A plan that builds every beat with the style's own all-in-one builder is using the builders. The reruns' plans name no builder at all, so their scores do not change. |

Case 23's checks were regraded offline on the six answers kept from the stage 12 comparison, before any new session:

| Check | Plain arm, old → new | Switched-off arm, old → new |
|---|---|---|
| check first | 0 → 3 of 3 | 0 → 0 of 3 |
| file first | 0 → 2 of 3 | 0 → 0 of 3 |

The plain answer that still fails file-first does build on the file before checking it: "Render the cut-out once to a movie with alpha, then build on that file", with the file check after.

Under the checks as committed, the same six answers stay at 3 and 2 (plain) and 0 and 0 (switched off). Case 30's switched-off answers stay at 0 on both of its checks.

**Fixed before any run:**
- answer checks became regex graders the runner scores, with "up front" a fixed 2,000 characters;
- picture graders lost the undocumented `m` flag;
- a case's files reach the run through `case.yaml` and `scaffold.sh`, since a run cannot read the eval directory.

## Reruns of cases 23 and 30 on the final build

Five sessions, after the checks above were widened and the style's opening gained its sentence.

| Case | The runner's scores | Graded again under the checks as committed | Before library parts |
|---|---|---|---|
| 23 (3 runs) | 0.82, 0.64, 0.73 (mean 0.73) | 0.82, 0.73, 0.82 (mean 0.79): check-first 3 of 3, file-first 3 of 3 | 0.36 |
| 30 (2 runs) | 0.43, 0.57 (mean 0.50) | unchanged | 0.14 |

- **Case 30:** both runs now read the style's builders section, D8, which no run had before. Their plans still name no builder; they plan by beat type.
- **Case 23:** the runner graded with the first widening; the second, made after seeing these answers, is what lifts check-first from 1 to 3.

## Found: the "second script" dialog

After the reruns, a read call from the supervising session's own server left After Effects showing "Attempt was made to run a second script while another script was already running". No eval session caused it: the five sessions made no After Effects calls at all.

**The cause:** the server launched its script, and After Effects did not start it within 2.5 s. The server's relaunch rule then launched again while the first launcher was still waiting on After Effects.

**A separate gap, found while tracing it:**
- Servers serialise launches only through a busy lock in their temp folder.
- So sessions with different temp folders (each eval sandbox) do not see each other's lock.
- The fix, built after this report: on macOS, no relaunch while the last launcher is alive, and one launch lock per user and per After Effects (`plugin/runtime/src/transport/launch-lock.ts`), held until the launcher exits, so it covers the script as well as the launch. The release steps still run sessions that may call After Effects one at a time (release-criteria.md says why).

## Library parts

**Measured with one session** against a probe server, read from its transcript, not its answer:
- Tool results of 20,000 to 48,016 characters reached the session inline. The host's documentation saves a text result over 50,000 characters to a file.
- When a result carries `structuredContent`, the host passes that to the session instead of the text.

**Built:**
- `ae_library` document replies are text only, with a header line (id, kind, size, sha256).
- A document whose reply would pass **40,000 characters** returns its outline and opening. The reply says on its first lines that it is not the document.
- `section` (an exact heading, the path where a heading repeats, or a list) returns those sections while they fit.
- **Coverage:** 20 of 106 documents are outlined; no reply is over 38,310 characters; every byte of each is reachable through its sections.
- **No document was rewritten.**
  - Two skills each gained one sentence.
  - The pixel headline style's opening gained one sentence that sends a planner to its builders section. Its runs had read 13 or 14 sections but not that one.

With parts, case 23's sessions read the keying guide's "Tell the user first" and "The procedure" sections, as the skill says. No session stopped at an outline.

## The blind test

`quality/blind/blind.mjs prepare` and `verdict`:
- It puts two movies through one fixed ffmpeg treatment: H.264 at CRF 15, one sound chain at a constant bit rate, trimmed to the shorter at the lower rate, metadata stripped.
- Two separate tosses set the labels and the encode order, and both files get the same timestamp.
- The key is kept outside the judge's folder.
- A verdict is written before the key is opened, and a second is refused.
- 15 offline tests run on drawn clips.

It removes the tells the four hand-run comparisons of 2026-11-10 left: write times in key order, sound bitrates that differed, and lengths that matched only by chance.

Its one real run, on the two halves of a side-by-side, went through from prepare to verdict to key. The judge had seen both movies before, so it was not blind in substance.

## Sessions and cost

**68 sessions, about $35.5.** No usage limit was hit.

| Runs | Sessions |
|---|---|
| Timing runs | 3 |
| Planning set | 22 |
| Picture set | 8 |
| Probe | 1 |
| Switched-off arms | 24 |
| Render reruns | 5 |
| Reruns of cases 23 and 30 | 5 |

## Known faults in the cases, left as they are

- **Case 22:** the assertion "with no score or pass or fail verdict" contradicts the case's own prompt, which has the session run the grader. Its answer then opens with the grader's pass.
- **Cases 05 and 08:** they expect a SKILL.md read, which an explicitly invoked skill does not leave in Claude's trace.
- **Case 11:** it continues an earlier session, which a single prompt cannot.

## Open

- **Case 30:** a plan written for a user does not name the style's builders; whether it should is a question for the work on building from a reference.

**Not done:** no no-plugin baseline was run.

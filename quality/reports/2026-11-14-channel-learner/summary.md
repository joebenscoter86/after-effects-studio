# Channel learner: what happened overnight (written 03:05, 2026-11-14)

## The short version

- **The goal you set is not met.** You asked for the video's techniques recreated and proven in After Effects renders. One was built and matches (the dotted ring, tip 1). The other 24 are waiting, because After Effects has been blocked since about 01:50.
- **What it needs from you:** unlock the Mac, bring After Effects forward, and press OK on the warning. Then tell this session. The build scripts for all 25 tips are written and ready to run.
- **What did get done:** the learner tool is built and reviewed, five videos are fully read, and 64 technique recipes are written and checked against the videos.

## Why After Effects is blocked

At about 01:47 I lent After Effects to the other session ("Fable 5.1 tests Comp Room's limits") for fifteen minutes of read-only eval runs, while my own work needed no After Effects. At the end of its runs a warning came up: "Attempt was made to run a second script while another script was already running." The screen had locked by then, so nothing could press OK.

- The other session traced it to a fault in the installed plugin: when After Effects is slow to pick up a call, the launcher tries again on top of the first try. It is fixing that on its branch.
- I did not force-quit After Effects, relaunch it or start a second copy. A relaunch under a locked screen has hung before.
- My proof project is intact: `quality/renders/channel-study/YBeMmC43Q1U/proof/proofs.aep`.

## What exists now

Everything is on the local branch `adobe/channel-learner`. Nothing is pushed.

| Piece | State |
|---|---|
| The learner tool (`tools/channel-learner/`) | Built. 90 tests pass. Reviewed by an agent that wrote none of it; its eight findings are fixed, each with a test that failed first. |
| Videos read end to end | 5: the Top 25 tricks video you sent, plus 3D typography, a cinematic scene build, five cinematic effects, and carousels. |
| Recipes written and checked | 64 (25 + 9 + 13 + 6 + 11), in `product/arsenal-drafts/`, one file per video. |
| The menu (`product/arsenal-drafts/INDEX.md`) | Written for the first 53; being rewritten for all 64 as I write this. |
| Build scripts for the first video's 25 tips | Written from the recipes alone. **None has been run.** |
| The tutorial's own finished picture for each of the 25 | Cut and ready to set beside each build. |
| Proofs in After Effects | 1 of 25 (tip 1), built before the block. |

## How a video becomes recipes

1. The tool downloads the video, gets every word with its time (local whisper, cross-checked against YouTube's captions), measures every frame, keeps the frames where something changes, and reads the text on them.
2. It writes a timeline: each spoken sentence beside the frames and the property values that changed while it was said. The whole of this takes about three minutes a video and uses no model.
3. One agent writes each recipe from the words and the screen together. Every step is marked said, shown or inferred.
4. A second agent, which did not write it, checks every claim against the frames. A recipe that fails goes back once.

## What the checks caught

Most recipes failed their first check on something, and all passed after correction. None had to be held back. The catches that would have gone into the library otherwise:

- **Missing steps.** A floor layer that has to sit just under the 3D layers to catch their shadows. A clip switched off while its frame is drawn, which must be switched back on. A whole effect stack pasted in from the finished example. Keyframes deleted before a value was changed.
- **The finished example made a different way.** Several tutorials demonstrate one route, then show a finished file made another way: an expression where keyframes were demonstrated, or different particle values.
- **Words and screen disagreeing.** The narrator says "decrease" while the panel shows the value raised; says "anchor point" while dragging the effect's centre. The recipes follow the screen and say so.
- **Things only the screen shows.** The text reveal is switched from characters to words without a word of narration. That is the same mistake the pixel run made.
- **An invented step.** One recipe added a "Remove All" click that never happens.

## What you should know before trusting any of it

- **Every recipe is unproven.** Checked against the video is not the same as built in After Effects.
- **The build scripts will need fixing when they first run.** They were written without After Effects and carry 168 "verify this first" notes between them.
- **One tip cannot be proven by script:** live-recording a puppet pin is done by hand, and scripts cannot create pins.
- **My builds use plain stand-in art.** The tutorials' examples use finished illustrations and photos. The proofs will show whether each technique works, not a finished look.
- **The text reader misses lone single digits.** Writers were told to crop and read those by eye, and the checkers verified them.
- **The first video's recipes had no sizes at first.** The script writers had to guess them. All 25 now have measured sizes, checked against the frames, and the scripts need those fed in on the first run.

## Decisions for you

1. **Unlock the Mac and press OK in After Effects,** then tell this session. I will run the 25 builds, render each beside the tutorial's result, and list what matches.
2. **More videos.** After six downloads in about an hour, YouTube began answering "Sign in to confirm you're not a bot." I stopped there. I will not sign in or use your browser's cookies to get past that check, and I changed the design, which had said to retry with Chrome's cookies. The choices are a much slower pace, or you supplying the video files yourself.
3. **Merging.** The menu found 16 techniques taught in more than one video (a particle field made from a graphic, a depth-of-field camera locked to a subject, shadows on a 3D floor, and others). It lists them as groups. I have not merged the recipe texts; say if you want that done.
4. **Push.** 40-odd local commits on `adobe/channel-learner`. The repository is public, so nothing goes up without your word. The drafts name no creator; `CREDITS.md` names the channel and links the videos, as you asked.

## Where to look

- The recipes for your video: `product/arsenal-drafts/YBeMmC43Q1U.md`
- The menu: `product/arsenal-drafts/INDEX.md`
- The one finished proof: `quality/renders/channel-study/YBeMmC43Q1U/proof/01/side-by-side.png`
- The full build record, in order: `quality/reports/2026-11-14-channel-learner/report.md`

Usage at 03:03: 28 % of the weekly limit (it was 14 % at 01:55). It resets at 07:00.

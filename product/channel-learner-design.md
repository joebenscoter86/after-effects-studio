# Channel learner: design

Status: draft for Joe's review, 2026-11-14. Nothing is built yet.

## Intent

Joe wants the plugin to be the brain of a professional motion designer. There is a mountain of techniques that make After Effects work look premium: drop shadows, camera shake, 3D moves, carousels, using real objects as inspiration, cinematic 3D compositions for B-roll, and whatever is trending. An agent would never know to reach for most of them.

Tutorial channels exist to teach exactly this. One video often teaches seven techniques. The channel learner lets the agent learn from such a channel the way a human viewer would: it watches every video and ties every word the creator says to what is on screen at that moment. It then turns each technique into a recipe the plugin carries.

The arsenal works in both directions. A creative director (for Joe, the brief writer in the Content repository) writes the storyboard. The plugin answers with how each beat can be executed and what would give it a wow factor. Both read the same arsenal.

## What we learned first (stage 14, the pixel-headline tutorial)

- A recipe read from frames alone was wrong in four ways. It had the text animating by letters when the narration says by words. It missed that the text is the spoken sentence, timed to the voice. It missed the order of events the author calls the point of the style. It called a free plugin paid. Rule: **no transcript, no recipe**.
- The centre of the style, stacked video cards, was shrunk to a row of thumbnails and still passed two reviews. A recipe must name what the author spends the longest on, and a check must confirm it is there.
- Getting the moves right took two hours and three tries on ten seconds of one video. Proving every technique that way does not scale, which is why recipes come first and proofs follow.
- Fable's switch-off tests (2026-11-14): when a guidance document is not read, a session stops using tools it still has. An arsenal nobody opens is worth nothing. Being found at the right moment is part of the job, not an afterthought.

## Goals

1. **Learn a channel unattended.** Given a YouTube channel, playlist or list of videos, produce for each video a timeline that lines up words, screen and on-screen values. Then produce one recipe for each technique the video teaches. The run can be stopped and resumed, and a video that fails does not stop the others. The first channel is the first of several, so nothing is built around one channel's habits.
2. **Recipes for everything; proofs for the best (Joe's choice, 2026-11-14).** Every technique gets a written recipe marked **unproven**. A technique becomes **proven** only when it has been built in After Effects through the plugin, compared with the tutorial's own result, and accepted by Joe.
3. **An arsenal organised by what a beat needs.** A menu groups the techniques by the job they do (for example: depth and finish, energy and impact, transitions, camera, 3D and B-roll, type, texture, trending formats). Each technique sits under every job it serves, and each entry gives a line on the effect and its status. The menu is the one front door to everything the plugin knows how to make: the learned techniques, the recipes the library already has, and its styles. Agents get one menu, not two.
4. **It gets used.** The motion-studio skill consults the menu when it plans shots, and the brief writer can read it through `ae_library`. An eval proves this: switching the arsenal off must lower the score.
5. **The same technique taught twice is one recipe.** When two videos or two channels teach the same thing, the recipe is merged and keeps both as variants, rather than appearing twice.

## Non-goals

- Shipping the learner in the plugin. It is a tool in this repository; only its results ship. A user-facing "learn this channel" skill can come later, once the arsenal has proven its worth (option C, deferred).
- Shipping any creator's footage, frames, transcript, wording or name in the plugin.
- Proving every technique.
- Techniques that only work in another program (sound design in a separate app, for example). They are recorded as out of scope, not converted.
- Windows, 32 bpc and colour-managed projects in proofs, until the rest of the plugin covers them.

## Anti-goals (failures even if it technically runs)

- A recipe written from frames alone, or from words alone.
- A recipe that states something confidently when the video never said or showed it.
- An arsenal so large and flat that agents never reach the right entry.
- Recipe text close enough to the creator's own words to count as copying.
- Pushing the Claude package past the directory's limits.

## Constraints

- **Package limits.** The Claude directory allows at most 512 files (the package is at 463 on the newest branch) and 256 KiB per non-image file. Hundreds of one-file-per-technique recipes would break this. So:
  - Recipes are grouped by job category, several to a file, with one section per recipe and each file well under the size limit.
  - The library can now return single sections of a long document (`ae_library` with `section`, on branch `adobe/pro-finish-library-parts`, not yet on main). An agent reads the menu, then only the recipe it needs.
  - The arsenal may use at most 12 package files for now. Raising that is a decision to bring back to Joe.
  - Every file is registered in `plugin/library/manifest.json`, and the Claude package is regenerated as AGENTS.md describes.
- **Naming.** The manifest already uses the kind `technique` for eleven method documents (word timing, reference teardown and others). The learned recipes therefore live in `plugin/library/arsenal/`, with a menu `arsenal-index` of kind `catalog`, as `style-index` is for styles.
- **The repository is public.** Downloads, frames, transcripts and timelines hold the creator's material and stay local and ignored, under `quality/renders/channel-study/` (already ignored by `.gitignore`). Recipes are written in our own words.
- **Tools on Joe's Mac:** yt-dlp 2026.08.19, ffmpeg, whisper-cli with `ggml-medium.en.bin`, Swift (for Apple's built-in text recognition), Node, and 1.4 TB free. No new installs are planned; if one turns out to be needed, it is named and asked about first.
- **Downloading.** One video at a time, with pauses, for private study. When YouTube answers with a sign-in or "confirm you're not a bot" page, the tool records it and stops fetching: it does not sign in, borrow a browser's cookies or work around the check. It tries again later at a slower pace, and Joe decides anything beyond that. (Changed 2026-11-14: the first draft said to retry with Chrome's cookies. On the first night YouTube raised that check after six videos in about an hour.)
- **What runs it, and usage.**
  - Gather and align are plain scripts. They use no model and cost no usage.
  - Distil runs inside a Claude Code session that Joe starts, on his subscription, with subagents doing the reading. No paid API key is involved. A session cannot be started from another session's turn, so a whole-channel run is one session working through a list in batches.
  - A ledger file records each video's state, so a run that stops (Joe's usage limit has stopped long runs before) picks up where it left off.
  - Reading frames costs far more than reading text. The agent reads text first and frames only where they are needed (see "Distil").
  - The budget is a number of videos per run. Phase 2 measures what one video costs; the number is set from that before phase 3 starts.
- **After Effects is not needed to learn.** Only proofs use After Effects, and they follow the existing rules: inspect the open project first, one controller at a time, never touch unrelated work.

## How it works (approach A, Joe's choice, 2026-11-14)

### 1. Gather (per video)

- List the channel's videos with their titles, durations and chapters.
- Download each video at a resolution where After Effects panel text is readable.
- Words: YouTube's own captions with word timings, preferring captions the creator uploaded over automatic ones. With no captions, transcribe the audio with local whisper at word level. Each word keeps its start, end and source.

### 2. Align (per video)

- Decode every frame and measure how much each one changes from the last, including small local changes such as a value typed into a panel. Every frame is measured; only frames where something changes get looked at closely.
- Keep a frame where each change settles, plus one at the start of every sentence.
- Read the text on each kept frame with Apple's text recognition, with its position. Compare consecutive readings to find value changes ("Amount 50 to 40 at 12:03"), and recognise the main panels (Effect Controls, the timeline, the Effects & Presets search).
- Write the timeline: each sentence with its time span, the frames inside it and the on-screen values that changed while it was said. Write it both as data for the tools and as a readable page for a person checking it.

### 3. Distil (per video)

- **Find the techniques.** An agent reads the transcript, the chapters and the value changes (text only, which is cheap). It splits the video into techniques, each with a name, a time span and what it is for.
- **Write each recipe.** For each technique, an agent reads that span's timeline and its kept frames and writes the recipe (fields below). Each step is marked **said** (in the narration), **shown** (on screen) or **inferred** (our reading). An inferred step is never written as fact.
- **Check each recipe.** A second agent compares the recipe with the timeline. It checks that every claim is said or shown, that what the author spends longest on is in it, and that no step is missing between two shown states. Recipes that fail go back once. One that fails again does not ship: it goes on a drafts list in the local study folder, with the reason, until a person clears it.
- **Merge.** Each new recipe is compared with the arsenal. The same technique becomes a variant of the existing recipe.

### 4. Recipe fields

Name; what it does for a beat (the jobs it is filed under); what it looks like; ingredients (effects and plugins, each marked stock or paid, with a stock substitute if the tutorial gives one); steps with settings, each marked said, shown or inferred; timing and easing when given; variations; pitfalls the author mentions; how the plugin would build it (native operations, a script, or not possible yet); status (unproven or proven); and a source reference kept outside the package (see open questions).

### 5. Prove (on demand)

A technique is proven only when Joe asks for it. A build that wants an unproven technique goes ahead, uses it, and says so in its hand-over; it does not stop for a proof. Proofs are done in this repository, not by the shipped plugin. The proof uses stage 14's method:
1. Rebuild the author's own result like for like through the plugin.
2. Measure it frame by frame against the tutorial's result with the same scripts, and check the largest elements are present at their size.
3. Put the two side by side for Joe's eye.

On his yes the recipe is marked proven. Where the technique is reusable, it gains a builder in a library module.

### 6. Use

- The menu is the arsenal's front door. The motion-studio skill reads it when turning a storyboard into shots and names the techniques it chose for each beat.
- A build that uses an unproven technique says so in its hand-over.
- A planning eval gives a storyboard whose beats call for techniques in the arsenal, without naming them. The plan must pick suitable ones. The switch-off comparison must show the arsenal moves the score.

## Phases

1. **Align one video.** Gather and align a single video from the first channel. Joe checks the readable timeline against the video: are the words, frames and values lined up?
2. **Distil that video.** Recipes for each of its techniques, checked by the second agent. Joe spot-checks them against the video.
3. **The whole channel.** Run it unattended with a budget; merge; build the menu.
4. **Wire it in.** The skill consults the menu; the eval and the switch-off test.
5. **First proofs.** The techniques Joe picks.

Each phase ends with something Joe can look at, and the next starts on his go-ahead.

## First case

The channel Joe was watching on 2026-11-14 (link to come), where each video teaches about seven techniques.

**Done when, for that channel:**
- every video has a timeline, or a recorded reason it has none;
- every technique has a checked recipe, or is on the drafts list with the reason;
- Joe's spot-check finds the recipes faithful to the videos;
- a fresh session, given only a storyboard, picks fitting techniques from the menu without being told they exist;
- the techniques Joe picks are proven.

## Left to the builder

Code layout (proposed: `tools/channel-learner/`, added to the AGENTS.md map), the change thresholds, how panels are recognised, the agents' prompts and models, the exact split of recipe files and the menu's categories, the budget mechanism, and test design. Tests that could reach After Effects or the downloader follow the repository's rule: fake the live systems first.

**Branches.** The tool touches no plugin files in phases 1 and 2, so it starts on its own branch from main. The library files (phase 3 onward) need the read-in-sections change, so they land after `adobe/pro-finish-library-parts` merges, and are coordinated with the session doing the pro-finish stages, since both regenerate the Claude package.

## Calls made in this document that Joe has not decided

These are Claude's proposals, made after a builder's review of the draft. Each can be overruled.

1. One menu covers everything: learned techniques, the existing recipes and the styles.
2. Built for several channels, with the first as the test case.
3. Distil runs in a session on Joe's subscription; the budget is videos per run, set after one video is measured.
4. A build may use an unproven technique and must flag it. Proofs happen only on Joe's request.
5. A recipe that fails its check twice does not ship.
6. The arsenal uses at most 12 package files, read one recipe at a time.
7. Until the credit question is answered, source links stay in the local study folder and out of the public repository.

## Open questions for Joe

- The first channel's link.
- Whether the creators are credited. Options: the plugin and repository name no one; the repository keeps a credits file with channel links while the plugin names no one; or the plugin itself credits the channels (which would change the non-goal above).

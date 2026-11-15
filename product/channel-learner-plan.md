# Channel Learner Implementation Plan (first video)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn one tutorial video into a word-to-screen timeline, a checked recipe for each technique it teaches, and After Effects proof renders beside the tutorial's own results.

**Architecture:** Plain Node scripts in `tools/channel-learner/` gather a video and align its words, frames and on-screen text into a timeline, with no model use. Agents then read the timeline and write recipes into `product/arsenal-drafts/`. Proofs are built through the installed Comp Room plugin and compared with crops of the tutorial's result.

**Tech Stack:** Node 25 (`node:test`, no dependencies), ffmpeg/ffprobe, yt-dlp, whisper-cli (`~/.whisper-cpp/ggml-medium.en.bin`), Swift with Apple's Vision framework, the Comp Room MCP tools.

**Spec:** `product/channel-learner-design.md` (approved by Joe 2026-11-14; credits: names in the repository only). This plan covers its phases 1, 2 and 5 for the first video, `YBeMmC43Q1U`. Phases 3 and 4 (whole channel, wiring into the plugin library) are not in this plan.

**Joe's instruction for tonight (2026-11-14):** work through the night without a review pause; the end goal is that the video's techniques are recreated and proven in After Effects renders; then start on more of the creator's videos if there is time.

## Global Constraints

- Study data (video, frames, captions, timelines, proof renders) lives only in `quality/renders/channel-study/<video-id>/`, which git ignores. Nothing of the creator's (footage, frames, transcript, wording) is tracked.
- Tracked recipes are in our own words. The plugin names no creator; `product/arsenal-drafts/CREDITS.md` names the channel and links the videos.
- No new installs. Tests use `node --test 'tools/channel-learner/tests/*.test.mjs'`, never reach the network or After Effects, and build their own small fixtures (synthetic buffers, ffmpeg `lavfi` clips).
- "No transcript, no recipe": a video with no usable words stops at gather with a recorded reason.
- Each recipe step is marked **said**, **shown** or **inferred**; an inferred step is never written as fact.
- After Effects: one controller at a time. Do not send it anything until the other session ("Fable 5.1 tests Comp Room's limits") says it is free. Inspect the open project before any write; never clear, close or replace unrelated work; build proofs in our own project file under the study folder. Do not undo after a render-queue change. Leave project defaults at 8 bpc with Adobe's colour engine.
- Commit locally on `adobe/channel-learner`; push nothing.
- Record progress in `quality/reports/2026-11-14-channel-learner/report.md` after every task (it is the ledger a resumed session reads first).

## Review Focus

1. Captions without punctuation: sentences must still break, on pauses and a word cap. (Task 1 test.)
2. A region that animates all the time (the creator's advert panel beside the viewer): it must not flood the kept frames. (Task 2 tests: `noisyCells`, and a cap in `pickFrames`.)
3. Flickering junk from icons in text recognition ("**B00•"): it must not be reported as value changes. (Task 3 test.)
4. A video whose captions cannot be fetched: fall back to whisper; with neither, stop with a reason. (Task 4 test with a fake fetcher.)
5. A 60 fps file holding 24 or 30 fps content: repeated frames count as calm, not as events, and times stay exact. (Task 2 test.)

---

## File structure

```
tools/channel-learner/
  learn.mjs              CLI: gather <url>, align <dir>, status <dir>; ledger in <dir>/state.json
  lib/words.mjs          captions and whisper output to words; words to sentences; transcript comparison
  lib/change.mjs         per-frame change measurement; noisy-cell detection; kept-frame selection
  lib/screen-text.mjs    differences between two frames' recognised text
  lib/timeline.mjs       timeline assembly and the readable page
  ocr/ocr.swift          Vision text recognition, one JSON line per image
  ocr/build.sh           compiles to tools/channel-learner/.build/ocr (ignored)
  tests/*.test.mjs
product/arsenal-drafts/  recipes (tracked, our words), CREDITS.md
quality/reports/2026-11-14-channel-learner/report.md
```

Shared types (plain objects):

- `Word = { t: number, end: number, text: string }` (seconds)
- `Sentence = { i: number, start: number, end: number, text: string, words: Word[] }`
- `FrameStat = { f: number, t: number, mean: number, share: number, cells: number[] }` (`cells`: share of changed pixels in each grid cell, row by row)
- `Kept = { f: number, t: number, why: 'settle' | 'motion' | 'sentence' }`
- `Box = { t: string, c: number, x: number, y: number, w: number, h: number }` (text, confidence, box as shares of the frame from the top left)
- `Change = { kind: 'changed' | 'appeared' | 'gone', text: string, was?: string, label?: string, x: number, y: number }`

### Task 1: Words and sentences

**Files:** Create `tools/channel-learner/lib/words.mjs`; Test `tools/channel-learner/tests/words.test.mjs`.

**Interfaces — Produces:**
- `parseJson3(json: object): Word[]` from YouTube's `json3` captions (`events[].tStartMs`, `segs[].tOffsetMs`, `segs[].utf8`); a word's `end` is the next word's start, or its event's end for the last.
- `parseWhisperJson(json: object): Word[]` from `whisper-cli -ml 1 -sow -oj` output (`transcription[].offsets.from/to` in ms, `.text`).
- `toSentences(words: Word[], opts?: { maxGap?: number, maxWords?: number }): Sentence[]`; defaults `maxGap` 1.2 s, `maxWords` 40. Break after a word ending `.`, `?` or `!`, at a gap over `maxGap`, or at `maxWords`.
- `compareTranscripts(a: Word[], b: Word[]): { agreement: number, disagreements: { t: number, a: string, b: string }[] }`; words compared lower-cased without punctuation, aligned by longest common subsequence; `agreement` is matched words over the longer length.

- [ ] Write failing tests: `parseJson3` on a three-event fixture gives exact times and ends; `toSentences` breaks on punctuation; unpunctuated words break at a 1.5 s gap and at 40 words (Review Focus 1); `compareTranscripts` of "set the amount to 40" against "set the amount to 14" reports one disagreement at the right time and agreement 0.8; `parseWhisperJson` on a two-word fixture.
- [ ] Run; expect failures for missing exports.
- [ ] Implement.
- [ ] Run; expect all to pass.
- [ ] Commit `Channel learner: words, sentences and transcript comparison`.

### Task 2: Change measurement and kept frames

**Files:** Create `tools/channel-learner/lib/change.mjs`; Test `tools/channel-learner/tests/change.test.mjs`.

**Interfaces — Produces:**
- `frameDiff(prev: Uint8Array, cur: Uint8Array, w: number, h: number, grid: [number, number], pixelThreshold: number): { mean: number, share: number, cells: number[] }` on 8-bit grey frames.
- `measureChanges(videoPath: string, outPath: string, opts?: { width?: number, height?: number, grid?: [number, number], pixelThreshold?: number }): Promise<{ frames: number, fps: number }>`; decodes every frame with ffmpeg to grey (defaults 960 by 540, grid 16 by 9, threshold 12) and writes one `FrameStat` JSON line per frame; `t = f / fps` with `fps` from ffprobe's `r_frame_rate`.
- `noisyCells(stats: FrameStat[], opts?: { cellShare?: number, activeShare?: number }): number[]`: cells whose changed share exceeds `cellShare` (default 0.01) in more than `activeShare` (default 0.5) of frames.
- `pickFrames(stats: FrameStat[], sentenceStarts: number[], opts?: { ignoreCells?: number[], cellShare?: number, settleFrames?: number, motionEvery?: number, minGap?: number }): Kept[]`. A frame is active when any cell outside `ignoreCells` exceeds `cellShare` (default 0.01). Keep: the first frame after an active run that is followed by `settleFrames` (default 6) calm frames (`settle`); one frame every `motionEvery` seconds (default 1.0) inside a longer run (`motion`); the frame at each sentence start (`sentence`). Drop a kept frame closer than `minGap` (default 0.25 s) to an earlier one, except that `settle` replaces `motion`.

- [ ] Write failing tests: `frameDiff` on buffers differing in one 10 by 10 block (right cell, right share); identical frames give zeros (Review Focus 5: a sequence where every second frame repeats yields no extra events); `noisyCells` finds a cell active in 80 % of frames and not one active in 10 %; `pickFrames` with a noisy cell ignored keeps one `settle` frame after a three-frame change, keeps `motion` frames about a second apart through a 5 s run, keeps sentence starts, and with the noisy cell not ignored would keep far more (assert the ignored result is at most 12 frames for a 20 s synthetic sequence, Review Focus 2); `measureChanges` on a 2 s ffmpeg `lavfi` clip (`color` then a `drawbox` change at 1 s) writes 2 × fps lines with one active stretch.
- [ ] Run; expect failures.
- [ ] Implement (`measureChanges` reads ffmpeg's `rawvideo` `gray` output from a pipe, frame by frame).
- [ ] Run; expect all to pass.
- [ ] Commit `Channel learner: frame change measurement and kept frames`.

### Task 3: On-screen text and its changes

**Files:** Create `tools/channel-learner/ocr/ocr.swift`, `tools/channel-learner/ocr/build.sh`, `tools/channel-learner/lib/screen-text.mjs`; Test `tools/channel-learner/tests/screen-text.test.mjs`. Add `tools/channel-learner/.build/` to `.gitignore`.

**Interfaces — Produces:**
- `ocr <image> [<image>...]`: one line per image, `{"file": string, "boxes": Box[]}`, accurate recognition, language correction off. A working single-image version is at the scratchpad path named in the report; extend it to many images.
- `readBoxes(ocrBinary: string, images: string[], opts?: { batch?: number }): Promise<Map<string, Box[]>>`.
- `diffBoxes(prev: Box[], cur: Box[], opts?: { posTol?: number, minConf?: number, ignore?: { x: number, y: number, w: number, h: number }[] }): Change[]`; defaults `posTol` 0.006, `minConf` 0.5. Boxes match when their top-left corners are within `posTol`. `changed` when matched boxes differ in text; `appeared` and `gone` otherwise. `label` is the nearest box to the left on the same row (y within `posTol`). Boxes under `minConf`, with fewer than two letters or digits, or inside an `ignore` rectangle are skipped on both sides.

- [ ] Write failing tests: a value box "50.0" becoming "40.0" with "Amount" to its left gives one `changed` with `label: 'Amount'`, `was: '50.0'`; a new row gives `appeared`; a low-confidence "**B00•" box that differs between frames gives nothing (Review Focus 3); boxes inside an ignored rectangle give nothing; a box shifted by less than `posTol` with the same text gives nothing.
- [ ] Run; expect failures.
- [ ] Implement; build the binary with `ocr/build.sh` and check it by hand on `quality/renders/channel-study/YBeMmC43Q1U/probe-45.png` (expect boxes including "Poppins" and "Layer Name").
- [ ] Run; expect all to pass.
- [ ] Commit `Channel learner: on-screen text and value changes`.

### Task 4: Timeline and the command line

**Files:** Create `tools/channel-learner/lib/timeline.mjs`, `tools/channel-learner/learn.mjs`; Test `tools/channel-learner/tests/timeline.test.mjs`, `tools/channel-learner/tests/learn.test.mjs`. Modify `AGENTS.md` (add `tools/` to the map).

**Interfaces — Consumes:** everything Tasks 1 to 3 produce. **Produces:**
- `buildTimeline(input: { video: { id: string, title: string, duration: number, fps: number }, chapters: { title: string, start: number, end: number }[], sentences: Sentence[], kept: (Kept & { file: string })[], changes: (Change & { t: number })[] }): Timeline`, where `Timeline = { video, chapters: { i, title, start, end, sentences: (Sentence & { frames: Kept[], changes: Change[] })[] }[] }`. A frame or change belongs to the sentence whose span contains its time, or the previous sentence when it falls in a pause. A video with no chapters gets one chapter spanning it.
- `renderTimelineMarkdown(timeline: Timeline): string`: per chapter a heading with its time; per sentence its time, text, changes as "label: was → text", and frame file names.
- `learn.mjs gather <url> --out <dir>`: info JSON, video (prefer 2160p), captions (`en-orig` json3; on failure whisper on the audio; neither: write the reason to `state.json` and exit 2, Review Focus 4), plus a whisper pass for `compareTranscripts`. `learn.mjs align <dir>`: changes, noisy cells, kept frames extracted as PNG at full size into `<dir>/frames/`, text recognition, `timeline.json`, `timeline.md`, `transcript-check.json`. Each step records itself in `state.json` and is skipped when already done. `learn.mjs status <dir>` prints the ledger.

- [ ] Write failing tests: `buildTimeline` places a frame and a change in the right sentence and a pause-time change in the previous sentence; no chapters gives one chapter; `renderTimelineMarkdown` contains "Amount: 50.0 → 40.0"; `learn` with injected fake fetchers skips completed steps on a second run and exits 2 with a reason when both captions and whisper fail.
- [ ] Run; expect failures.
- [ ] Implement.
- [ ] Run the whole suite; expect all to pass.
- [ ] Commit `Channel learner: timeline and command line`.

### Task 5: Align the first video and check the timeline

- [ ] Run `node tools/channel-learner/learn.mjs gather` (the video is already downloaded; it should adopt it) and `align` on `quality/renders/channel-study/YBeMmC43Q1U`.
- [ ] Check by eye, for three tips spread through the video: the sentence, its frames and its value changes against the frames themselves. Fix what is wrong (thresholds, ignored regions) with a failing test first.
- [ ] Record in the report: frames kept, text boxes, value changes, transcript agreement and the disagreements that touch numbers or effect names.

### Task 6: Distil the 25 tips into checked recipes

**Files:** Create `product/arsenal-drafts/YBeMmC43Q1U.md` (recipes, our words, no creator name), `product/arsenal-drafts/CREDITS.md`.

- [ ] Techniques list (text only): one entry per chapter tip with a name of our own, time span and purpose; `quality/renders/channel-study/YBeMmC43Q1U/techniques.json`.
- [ ] Recipes: agents in parallel, about five tips each, read that span of `timeline.md` and its frames (downscaled copies, plus full-size crops where a value is small) and write the design's recipe fields, each step marked said, shown or inferred, plus `result: { start, end }` (where the tutorial plays the finished effect) for the proof.
- [ ] Check: fresh agents compare each recipe with the timeline (every claim said or shown; what the author spends longest on is present; no step missing between two shown states). Failures go back once; a second failure goes to `drafts-held.md` in the study folder with the reason.
- [ ] Commit `Arsenal drafts: 25 techniques from the first video`.

### Task 7: Prove in After Effects

Per technique, in tip order, when After Effects is free:

- [ ] Cut the tutorial's result (the viewer crop over `result`) to `proof/<nn>/reference.mp4`.
- [ ] Build it through the plugin in `proof/proofs.aep`, one comp per technique at the reference's aspect, rate and length, with our own stand-in text, shapes and pictures.
- [ ] Render to `proof/<nn>/build.mp4`; make `proof/<nn>/side-by-side.mp4`.
- [ ] Compare: run `measureChanges` on both and compare the timing of the change peaks; look at matched frames; have a fresh agent list the visible differences without being told which side is ours. Fix and repeat while the differences are in the technique itself.
- [ ] Record per technique in the report: matches by measurement and review (awaiting Joe's eye), partial with what differs, or not built with the reason (paid plugin, plugin cannot do it yet, another program).

### Task 8: Morning report

- [ ] `quality/reports/2026-11-14-channel-learner/report.md`: what was built, the counts, the per-technique table, what the plugin could not do, and the questions for Joe. One reel of the side-by-sides for his phone.
- [ ] Whole-branch review by a fresh agent; fix Critical and Important findings test-first.
- [ ] Commit. Push nothing.

### Task 9 (if time): the next videos

- [ ] Run gather, align and distil on the channel's next videos, newest first, recording each in the report. Proofs only after the first video's are done.

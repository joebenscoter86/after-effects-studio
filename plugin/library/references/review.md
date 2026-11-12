# Review by someone who did not build the piece

A builder knows what each moment was meant to show and sees that. A fresh viewer sees what is there. Before a build is called done, a reviewer who did not build it looks at the delivered comp from the evidence below and nothing else. This is the procedure for both sides.

## Who reviews

- Where the host can start a fresh agent, hand the review to one. In Claude Code that is the plugin's reviewer agent, `comp-room:motion-reviewer`: it can read files, render frames and run the whole-piece check, and cannot change the project. In another host, start a fresh agent with the motion-review skill and the hand-over packet below.
- Where the host cannot, the builder does a frames-only pass itself: set the build notes aside, judge only from the brief, the report and the frames, write the findings in the form below, and say in the hand-over that the review was not independent.

## What the reviewer is handed, and nothing else

1. The brief: what the piece is for and who sees it, the exact on-screen copy, references, and stated constraints (format, duration, brand, and the times of beats or markers the motion must hit).
2. The project, and the name or id of the delivered comp; the export path if there is one.
3. The `ae_check_comp` report for the whole delivered comp (every call until `next` is null) and the path of its contact sheet.
4. Frames at the moments that matter, as file paths: `ae_render_frame` strips (`strip: { at, frames }`) around each cut, hit and hand-off, and full-size stills of each reading hold.
5. A preview movie (`render.preview` through `ae_do`), where the host can play one.

Not the builder's notes, reasoning, earlier drafts or list of what it already fixed: they tell the reviewer where to look, and it stops seeing the rest. The reviewer may render more frames and read comp and layer info; `ae_comp_info` lists the comp's markers with their times and comments, so a beat the brief names can be checked against its marker. It changes nothing.

## What the reviewer returns

Defects, most noticeable first. For each:

- **when**: seconds and frame, or a span from and to;
- **where**: the region of the frame or the layer ("presenter's left edge", "lower third", "whole frame");
- **what** a viewer sees, in plain words;
- **evidence**: the file or number it rests on (a sheet tile, a frame path, a flag in the report, a sampled value);
- **severity**:
  - `first-watch`: a viewer notices on one ordinary watch at full speed (a flash, a colour cast on a face, a word cut off, a jump);
  - `careful-watch`: noticed looking closely or on a second watch (a fringe round a cutout, a hit a few frames late, a soft background);
  - `polish`: only a specialist would name it; fix it if it is cheap.

Then **Not judged**: what the evidence could not show, said plainly (motion feel at speed without a movie, sound and sync, anything outside the delivered comp).

No score, no pass or fail, no overall verdict. The list says what is there; the builder decides what to fix.

## Reading the whole-piece flags

Every `ae_check_comp` flag ends as one of two things: fixed, or named in the hand-over with the reason it is intended (a held title is a frozen stretch, a fade to black is near-black, white type sits at 255). The reviewer checks each flag against the frames and the brief and reports it as a defect only when it is not intended. Two defects from a real piece that only a whole-piece check showed:

- two stray frames of another take just before a cut in the supplied footage, so the picture jumped two frames ahead of the cut the title and caption were on: on stills it looked like one cut, and it was found because the check flagged two jumps two frames apart (when the report shows two jumps close together, render every frame between them);
- two stray frames of the next take at the end of the piece, after the last moment anyone had rendered.

A subject cut out with Object Matte (`keying`, last section): check what was left out, above all things the subject holds or sits against (a microphone, a chair, a cup), any hole or opening in the cut-out (a gap where the shirt should show; a missed object that runs off the frame edge), and the hard edge, about 1 px wide, against the new background.

Some defects raise no flag: a colour cast, a soft background, a fringe and a beat hit late are steady states or timing against the brief. Only looking at frames against the brief finds them, so the frames are not optional when the report is clean.

## The loop

1. Builder: run `ae_check_comp` on the delivered comp, render the frames, hand over the packet.
2. Reviewer: return the list.
3. Builder: fix what it decides to fix, re-run `ae_check_comp`, re-render the changed moments, and hand over fresh evidence (to a fresh reviewer, or the same one with the new evidence and its last list).
4. Stop after two review passes, or sooner when the latest list has nothing at `first-watch` or `careful-watch`. Report what is left rather than starting a third pass.

## The hand-over message

To the user, after the loop:

- who reviewed (a fresh agent, or the builder's own frames-only pass, marked not independent) and what it found, by severity;
- what was fixed, with the frames that show it;
- what was left and why: each flag judged intended with its reason, each defect not fixed with the reason;
- what nobody could check (playback at speed, sound, the export on the target player).

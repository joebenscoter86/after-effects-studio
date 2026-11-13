# Planning long or unattended After Effects runs

An agent can run After Effects for hours: captures, cut-out renders, a full delivery render. Unattended, a single dialog stops everything. This document is what went wrong on the first full piece and the plan that avoids it.

## What happened

With the Mac's screen locked, After Effects raised an error box. A locked screen cannot dismiss it, so every following call hung behind it until it timed out. After a force-quit, relaunching After Effects with the screen still locked hung too. The box came from a whole-frame check that deleted its capture folder while captures it had queued were still being written. The command-line renderer, `aerender`, still worked on the saved project throughout.

A second box stopped After Effects on the same piece, the morning after: "Unable to execute script at line 1. File or folder does not exist", with one OK button. A script call had been queued, and its temporary script file was gone by the time After Effects came to run it. It is harmless in itself, but nothing can run until someone clicks OK, and a background click or a Return key sent to the app did not reach it: a person at the Mac had to click it. Read such a box from a screenshot before doing anything to it, and never send Escape or a key at a box you have not read, because on a question a key is an answer.

## The plan

1. **Keep the screen unlocked and the Mac awake** for the whole unattended run: no screen lock, no sleep, no screensaver password (`caffeinate -dimsu` keeps it awake for as long as it runs; the lock setting is the user's to change). Say this to the user before they leave. An agent cannot unlock the screen or start After Effects through a locked one.
2. **Get every step that needs the user's click before they leave.** The subject cut-out needs one click with the Object Matte Tool (`keying`, and the motion-studio skill's cut-out section); a dialog that asks for permission, a missing font or a plugin licence also needs a person. Do those first, check them, then let the user go.
3. **Save the project before any long capture or render**, under a name of its own, so a hang or a crash costs the run, not the work, and so `aerender` has a file to render.
4. **Never leave queued work behind when a step returns.** That covers a script call queued for After Effects whose temporary file is then removed, as well as captures.
   **Captures in particular.** A step that queues captures or renders must wait for them all to finish (or cancel them) before it returns, and must not delete or move their output folder while any are pending. Check the folder's file count against the count queued.
5. **Plan `aerender` as the fallback renderer.** If After Effects stops answering, render the saved project from the command line: `aerender -project <file.aep> -comp <name> -output <file> [-RStemplate <name>] [-OMtemplate <name>]` (it ships beside After Effects, in its application folder). It runs without the user interface; on the first piece it rendered the saved project while the application was stuck behind its error box. Check free disk space for it as for any render.
6. **Check free disk space and purge the cache between long renders.** Object Matte renders filled about 12 GB of disk cache for each half of a 43 s piece at 1088 × 1920, and about 19 GB for 320 frames of a 4K take (`keying`). Before each long render, check the free space on the drive After Effects caches to; when it is low, purge (Edit > Purge > All Memory & Disk Cache, or `app.purge(PurgeTarget.ALL_CACHES)` by script where the user has agreed to that). Split a long render into halves with a purge between them rather than letting one run fill the disk.
7. **Time out and inspect, never resubmit blindly.** A call that times out most often sits behind a dialog (`scripting`). Inspect state before retrying; if After Effects does not answer, switch to `aerender` on the saved project and report what happened.

## Checks before leaving a run unattended

- Screen lock and sleep are off, and the user knows it.
- Every click the run needs has been made and checked.
- The project is saved; the render queue and output paths are what the run expects.
- Free disk space covers the estimated cache for the next render with room to spare; the purge step is in the plan.
- The fallback `aerender` command line is written down with the project path, comp name and output.
- Each step that queues work waits for it to finish before it returns.

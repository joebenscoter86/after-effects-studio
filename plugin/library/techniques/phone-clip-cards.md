# Turning phone screen recordings of clips into video cards

A piece that talks about other videos (a trend, a format, an example) often shows them as cards: a short clip in a rounded frame beside or over the speaker. The source is usually a phone screen recording of the clip playing in an app, which carries the app's buttons, captions, progress bar, the phone's status bar and sometimes a notification. A card must show only the clip.

## Rights first

Use only recordings the user has the right to show: their own clips, clips they have permission for, or a use they have decided is theirs to make. Ask when it is not clear. Do not add other people's clips to the plugin, a report or a test fixture; keep them in the user's project.

## When to use it

- A beat needs a short moving example of someone's clip, shown as a card.
- The only source is a screen recording from a phone.

Not for: a clip the user has as an original file (crop and place that directly), or a still (a screenshot crop is enough).

## Method

1. **Find the video area.** `clip-card.py preview <recording> still.png --at T` writes a full-size frame with a 100 px grid. Read the box that holds only the picture: below the status bar and any top bar, above captions, the progress bar and the buttons, inside any rounded player corners. Draw a candidate with `--crop W:H:X:Y` and look again at a frame where the player's captions or buttons are showing.
2. **Choose the time range.** Keep source seconds where no pop-up, notification, scrubbing or app transition shows. Cut before the clip ends and the app shows its replay or next-clip screen.
3. **Slow a short clip, never loop it.** When the beat is longer than the clip, slow it first (`--slow 1.5` makes it 1.5 times as long). If the slowed clip is still shorter than the beat, it freezes on its last frame for the rest (`--hold` with the beat's length); it never runs past its end and never jumps back to its start. A loop reads as a glitch on a card the viewer is watching.
4. **Output an upright card.** `clip-card.py make <recording> card.mp4 --crop W:H:X:Y --start S --end E [--slow F] [--hold SECONDS]` crops, trims, slows, scales to `--size` (default 860 × 1118, the size used on the first full piece, filling and centre-cropping when the crop's shape differs) and writes H.264 at 30 fps, CRF 14, BT.709, no audio. Pick a crop close to the card's shape (about 0.77 wide to high) so little is lost.
5. **Put the card in After Effects as footage**, give it its frame, shadow and rounding there, and keep the user's voice as the only sound unless the brief says otherwise.

## Values that worked

- Card size 860 × 1118 in a 1080 × 1920 piece.
- Slow factors up to 2: a 60 fps phone recording slowed 2 times still gives 30 new pictures a second. Above that, or from a 30 fps recording, frames repeat; watch for stutter, and prefer a shorter beat or a freeze to a heavier slow.
- A freeze on the last frame for the rest of a beat reads as intentional when the card is leaving or being talked over.

## Script and dependencies

`scripts/capture/clip-card.py` (library document `clip-card-py`), subcommands `preview`, `make` and `check`. Needs Python 3.9+ and ffmpeg and ffprobe on PATH. The crop box, trims, slow factor, hold and size are arguments; nothing is hard-coded.

## Checks

1. `make` ends by running `check`: it writes the first, middle and last frame side by side to `<card>-check.png` and prints size, frame rate, frame count and duration. Look at all three. No button, caption, progress bar, status bar, notification, app logo or rounded player corner may remain, and the subject must not be cut off at an edge. Any of those means a tighter crop or a different time range, then `make` again.
2. Duration equals the beat (with `--hold`) or the slowed clip; the card never shows the clip restarting.
3. Watch the card at full speed in the piece: slowed motion should look calm, not choppy.

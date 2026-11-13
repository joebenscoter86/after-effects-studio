# Timing a stressed word from the voice

A hit that lands on a spoken word (a headline slam, a card arrival, a cut) has to be placed on the frame where that word starts in the locked audio. A transcript's word times are not good enough for that: on the first full piece, the transcriber's own word times were off by more than half a second, which is fifteen frames at 30 fps. This technique finds the word's first frame from the sound itself.

## When to use it

- One or a few hits must land on particular words of a voiceover or a talking-head take, after the audio is locked.
- A hit already placed from a transcript looks early or late at full speed.

Not for: laying out every caption word (use the transcript, then check the stressed ones this way), or music beats (`sound.markers` and `sound.sync` in `timing`).

## First: get the voice on its own track

Takes from some cameras carry the voice on channel one of four. After Effects can play such a take as silence, and a level reading of the mixed file is wrong. Run `word-timing.py channels <take>`: it prints each channel's RMS and peak level. When there are more than two, or the voice is on only one, extract it: `word-timing.py extract <take> voice.wav --channel 1` writes a mono 48 kHz WAV. Time against that file, and put the same file in the composition in place of the take's own audio. (`subject.prepare` reports the same case as `soundAdvice`.)

## Method

1. **Find a candidate window** from the transcript or by ear: a second or so around the word.
2. **Measure the level per frame.** `word-timing.py levels voice.wav --start S --end E` prints the RMS level of each 1/30 s window in dBFS, the change from the frame before, and a bar. Speech after a breath or pause shows as a run of low frames then a jump in one or two frames (in the offline test below, a pause read -52 to -61 dBFS and the word's first frame rose 31 dB above it). Within running speech, word boundaries show as dips (10 to 17 dB in the same test). List the rises in the window; one of them is the word.
3. **Cut and transcribe what is left.** `word-timing.py trim voice.wav --frames A-B --word WORD --cmd "<transcriber> ... {wav}"` cuts the audio at each candidate frame F, keeps the next two seconds, transcribes only that and reports whether WORD is among the first three words heard. Any command line transcriber that prints its text to standard output works; with local whisper.cpp: `--cmd "whisper-cli -m <model.bin> -f {wav} -nt -np -l en"`.
4. **Read W.** The script reports W, the first cut at which the word is no longer heard in the trimmed tail; that is the method used on the first piece. Then read W against the levels: a transcriber still recognises a word with its first few frames cut. In an offline test on synthetic speech the word stayed heard with its first 4 frames (133 ms) removed: the level rose out of a pause at frame 51 and the word was lost at frame 55. So when the levels show a clear rise a few frames before W with no other rise between, that rise is where the sound of the word begins; when the word runs on from the one before it, W and the nearest dip are the best evidence there is.
5. **Place the hit.** Frames count from the start of the WAV; add the frame where that audio starts in the composition. A visual arrival usually starts 0.1 to 0.25 s before the word so it lands on it (`construction`); set the arrival's settle or impact frame, not its first frame, on the word.

## Values that worked

- One level reading per frame: a 1/30 s window, RMS, in dBFS.
- Two seconds of tail per cut, the word among the first three heard, one-frame steps over a range of 10 to 15 frames. With a medium English whisper model on an Apple-silicon laptop each cut took about 1.7 s, so an 11-frame range ran in under 20 s.
- Transcriber word times: do not use them for a hit. They were off by more than 0.5 s on the piece.

## Script and dependencies

`scripts/capture/word-timing.py` (library document `word-timing-py`), subcommands `channels`, `extract`, `levels` and `trim`; `--fps` defaults to 30. Needs Python 3.9+, numpy, ffmpeg and ffprobe on PATH, and for `trim` a local transcriber with a model (whisper.cpp's `whisper-cli` is one; the model file path is the user's). Nothing is sent off the machine.

## Checks

1. `trim` reports a single change from heard to not heard. When it warns that the result flips more than once, the transcriber is guessing: lengthen `--tail`, raise `--first` for a short word, or listen.
2. The frame you place is on or just before a rise in the levels, not in the middle of a loud run.
3. Watch the hit at full speed with sound. A hit on the right frame can still feel early on a word with a soft onset (an "h" or "f"); judge by ear and say which frame you chose and why.

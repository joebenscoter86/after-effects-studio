# Typography, narration and real evidence

## Separate the reading jobs

The section title tells the viewer what the idea is. Captions convey speech. Evidence shows the specific result. The hero performs the explanation. Give each a distinct area and priority; do not force all four into the same small zone. A one-second line may read better held as a phrase than as several animated words.

The pipeline's successful title treatment combined a structural line and expressive line, held across the section. That relationship is reusable; the exact fonts, palette and coordinates are optional. Pick installed fonts and render them at output size. Measure actual bounds with sourceRectAtTime and account for baseline, tracking and italic overhang.

## Text animation

Use a text animator, mask or controlled reveal so the phrase builds internally. Related lines can stagger by two frames; the VO study used a three-frame opacity reveal and six-frame slide for phrase lines. If the headline carries visual energy, subtitles can remain plain hard cuts. Do not make “premium” mean every text layer scales, rotates, glows and highlights simultaneously.

For a large word, decide its line break and relationship to the hero before shrinking it. A text fit that works in the static composition can fail on a camera push. Test the widest actual string, symbols, punctuation and font instance. If a glyph is absent, use a suitable font or native drawn symbol rather than silently dropping it.

## Land on the word

Time from the locked audio/transcript, including word onsets. Visual anticipation begins before the spoken noun so the arrival lands on it. Don't move the source cut to make an animation easier unless editing that cut is in scope. Leave intentional pauses; don't fill silence with unrelated animation. Clear subtitles across longer silence unless the phrase intentionally holds.

Inspect transition words near section boundaries. Floating-point timestamps and inclusive boundary rules can put the first word into the previous section. Quantize visual cuts to frames and document whether spans use `[start,end)`. A half-second timing error in the back half of a long transcript is material; verify against actual audio or per-take timing rather than trusting a single transcription pass.

## Real UI must be readable

Crop to the controls or text being discussed before fitting a full desktop into a phone-sized card. The source pipeline used roughly 22px UI text in a 1080px-wide composition as a readability check; assess final delivery scale rather than treating that as a universal minimum. Preserve the recording's aspect ratio and avoid cover-cropping through words. Measure positions on a grid at a known scale; don't infer full-res coordinates from an unlabeled half-size contact sheet.

## Preserve the meaning of evidence

Distinguish source recording, exact reconstructed text, editorial illustration and hypothetical data. Label reconstruction where needed. A draft is not sent-message evidence. A prompt is not an AI response. A generated moving screen may redraw numbers between frames; exact data and proof should remain native or captured.

For a transfer between real interfaces, carry the real selection as the star and keep enough source context to identify it. Remove the destination duplicate until the carried object lands, match the landing geometry, then complete the compositing hand-over without a pop. See `worked-scenes`.

## Caption and audio finish

View at delivery size, both with sound and muted. The image should make the main idea legible without relying on tiny subtitles; audio review checks phrase sync and pacing. SFX mark selected causes or landings, not every property change. Music supports speech and emotion. Choose mix targets and licensing appropriate to the delivery; JoeB's historical loudness and arpeggio preferences are not imposed on every user.

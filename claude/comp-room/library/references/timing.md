# Timing and motion vocabulary

Values below are useful starting points adapted from the Content pipeline's October 2026 experiments. They are not universal rules or measured predictors of audience response. Specify times in frames at the actual comp frame rate; rescale timing deliberately for different formats.

| Intent | Starting point | Watch for |
|---|---|---|
| Soft arrival | outgoing influence 28, incoming 85 | Sluggish final travel; shorten if the hold eats the scene |
| Deliberate travel/fill | 82 out / 82 in | A heavy S-curve may delay a word hit |
| Accelerating exit | 75 out / 12 in | Leave enough room and time for the hand-off |
| Small pop | 3-frame linear move, then a damped spring | Repeated bouncing distracts from explanation |
| Related objects | 0.15–0.2 seconds apart | Stagger relative to action and reading needs |
| Tiny handles/details | 2–3 frames apart at 30 fps | Too many independent events split attention |
| Settle | 13–15 frames at 30 fps as a starting study | Weight should fit the material |

## Spring

The bundled expression samples the final key's incoming velocity and adds a damped sine: amplitude 0.05, frequency 2.6, decay 6.5. Use on a short linear launch into the resting value. Keep real image scale: a 600px image displayed at 120px rests at 20%, not 100%. Never attach the spring to every property indiscriminately.

## Temporal ease dimensions

Spatial Position properties take one KeyframeEase per side even though their values are vectors. Nonspatial multidimensional properties such as Scale take one per dimension. Inspect propertyValueType and isSpatial. Set interpolation explicitly; do not assume inserting keys makes them linear.

## Whip hand-off study at 30 fps

Outgoing y-offset samples: 0, -8, -26, -66, -150, -430, -760.
Incoming samples: 640, 300, 118, 56, 26, 11, 4, 0.
These are measured offsets for one look: scale travel with layout, retain the acceleration profile, use frame samples as linear keys, and introduce the incoming scene on the fast frame. Selective motion blur can connect travel without blurring small type.

## Density and restraint

The JoeB preset uses roughly 12–16 overlapping construction events per 2.5–6 second section. Do not turn this into a generic quota. A cinematic title may require a long hold; a UI explainer may need fewer states to stay legible. Count meaningful changes rather than keys. Pacing must serve understanding.

## Reading motion and sound

Measure the curves and the sync before calling timing done. A linear move and a hit a few frames off the beat are easy to miss in stills.

1. **Each move's curve.** `ae_do { operation: "motion.curve", args: { comp, layer, property: "Position", outPath } }` reads the property at every frame of the layer's span (or `start` to `end`). It gives the speed per frame, the moves (from rest to rest) and the keys with their interpolation, and draws a 480 × 160 graph: values light, speed orange, moves shaded, flags red. It flags three things:
   - **No ease:** a move whose first or last moving frame already runs at 60% or more of its middle speed. An easy ease's first frame of 30 runs at about 7%; a linear move's at 100%.
   - **Speed jump:** speed changing 2.5 times from one frame to the next inside a move, by a quarter of its top speed.
   - **Overshoot:** how far a move goes past where it ends (share of its distance) and how many frames it takes to settle within 1%.
   A mechanical, constant move can be linear on purpose; say so rather than easing it.
2. **Word and beat markers.** `ae_do { operation: "sound.markers", args: { comp, timing } }` reads a timing file: a JSON list of `{ word | w | text | label, start | time | t }` in seconds or `frame`, or CSV `time,label`. `{ comp, layer }` instead reads the layer's loudness: After Effects' Convert Audio to Keyframes runs from the script (no dialog), the amplitude is read per frame and the helper layer removed, and a beat is marked where loudness rises past 30% of the way from its median to its top. Markers read `sound: <label>`; earlier ones with the prefix are replaced.
3. **Sync.** `ae_do { operation: "sound.sync", args: { comp, inPoints, keys, events, markerPrefix: "sound:" } }` gives each event's distance in frames to the nearest marker, positive after it. Events can be layers' in-points, the key times of `{ layer, property }`, or times you give (spikes from `ae_render_frame` diff). It flags 2 frames or more after the marker, or 4 or more before. Those are ITU-R BT.1359's thresholds for noticing sound 45 ms early or 125 ms late against the picture, at 30 fps: a hit after its sound is noticed sooner than one before it.

**Measured live** (After Effects 27.0, 2026-11-12, scratch projects):

- **Convert Audio to Keyframes:**
  - On mono and stereo WAVs with tone bursts at 0.5, 1.2 and 2.0 s, it peaked on frames 15 to 16, 36 to 37 and 60 to 61; `sound.markers` marked 15, 36 and 60 in under a second.
  - A four-channel WAV with the signal on channel 1 read as the left channel (right flat, both channels half).
  - The four-channel AAC take (voice on channel 1) read a top of 0.002 against 21.2 for a tone at 0.3 of full scale: silence. `sound.markers` refuses anything under 0.1 and says to extract a mono WAV; the extracted voice gave 13 onsets.
- **The done-when comp** (30 fps): one move eased with easy ease, one linear, and three layers starting at 0.5 s, 1.2 s and 2.0 s plus 4 frames, against those beats.
  - The eased move came back clean.
  - The linear one was flagged: its first and last moving frames run at 100% of its middle speed.
  - The hits read 0, 0 and 4 frames after their markers; the third was flagged late.

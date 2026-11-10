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

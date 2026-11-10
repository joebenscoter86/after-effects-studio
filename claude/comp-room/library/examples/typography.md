# Typography worked examples

## Native fitting and mechanism study

Input: editable horizontal Latin text, explicit source-space bounds, installed approved fonts, a caller-owned layer. Accented “Café déjà vu — naïve façade” fit its 1000px area at approximately 79.87px with AvenirNext-Medium on the tested host. A longer paragraph retained its final sentence, wrapping into four readable lines. The unavailable requested face was replaced only by an approved installed fallback; an unbroken word at the minimum returned overflow rather than losing copy.

The first paragraph fixture was placed as though its origin matched point text. Native bounds exposed a negative box origin. The fixture moved to a suitable position; the fitter continued to preserve transforms. This is why source-space fit and composition layout are separate jobs. Other hosts must discover installed faces and remeasure; these values are evidence, not required design settings.

An entrance study compared clean, word/line stagger, masked and restrained impact at 24/30/60 fps. Each landed at the same intended time. Stagger used a native text animator and kept the complete string in one layer. Phrase replacement aligned “From busy motion” with “To a clear message”, faded out the old phrase, then resolved the new. Both editable layers remained in the project. Repeating a helper against an animated target returned conflict without duplicates. All start/action/landing frames were inspected; full-speed perceptual playback was not performed.

For a new scene, call AESType.fit before authoring animation, inspect overflow and bounds, then AESType.reveal with an owned target and chosen intensity. For replacement, provide both fitted layers to AESType.replacePhrase. Exact calls and scope live in typography-recipes. No private report, font file or rig is needed to reproduce the mechanism. Source repository reports provide additional evidence, not runtime dependencies.

## Editorial bookshop announcement

Input: a fictional 10-second landscape announcement, cream #F4EFE5, ink #2E3038 and muted purple #77568A. Exact copy: “A new chapter opens.”, “Willow & Page”, “Independent books. Shared discoveries.” Only native editable type and a rule; no external artwork.

Design: the first line begins as the message, then moves upward and reduces to a heading as the bookshop becomes the dominant name. The same purple rule expands under the name to connect the beats. A static camera and broad whitespace suit the editorial voice. Installed Baskerville Italic, Baskerville and Avenir Book supplied contrasting roles on the tested host; use approved alternatives and remeasure elsewhere.

Implementation: a word-selector entrance reveals the opening from .2–1.2s. It rests, then moves/reduces from 2.7–3.6s. The shop name arrives from 3.4–4.6s, followed by AESType.reveal(clean) on the support line from 5–5.8s. The final lockup holds to 10s. Five native layers contain the three complete text strings, background and editable rule. Animation lives in selectors/transforms; Source Text stays editable.

Correction and review: the initial ampersand was ink; revising it to purple connected the name with the rule. Initial and revised captures were retained. Native and decoded frames showed readable hierarchy and about 46px between the name’s descender and rule. The MP4 is 1920×1080, 30fps, 300frames, and fully decodes. Full-speed perceptual review and user acceptance remain pending. A quiet first frame and a 4.2s resolved hold are intentional editorial choices, not evidence of audience performance.

## Energetic portrait treatment

Input: a fictional 12-second 1080×1920 community dance announcement. Copy: “Find your rhythm.”, “Move Together”, “A community dance night.” Dark blue #111829, cream #FAF4E8 and lime #C6FF5C distinguish it from the editorial page. Bricolage Grotesque ExtraBold supplied the display voice and Avenir Next Medium the support on this host; discover available approved alternatives rather than require these faces.

Design and mechanism: a small rhythmic lime accent expands into a rounded stage for the title. The title has one expressive tilt/scale arrival, then the same stage moves upward to make room for the invitation. First copy settles at 1s, title at 4.6s, final invitation at 8.8s with a 3.2s hold. Eight native layers retain the full text, editable stage, solid background and title carrier. Contrast comes from a single emphasis against quieter holds, not repeated effects.

Correction: fractional-frame timing was snapped to the 30fps grid and text out-points trimmed to the composition. A null’s opacity does not fade its children; the actual title text layers received the fade keys. This preserved the intended shared carrier while fixing visibility. The first pass and corrected frames remain in source-repository evidence.

Review: sixteen native/decoded frames show clear hierarchy, full copy and no sampled card/text collision. A 360-frame geometry check found positive canvas clearance; all exported keys lie on the frame grid. The 12s MP4 fully decodes. Encoded flat colors vary slightly from native RGB values, so exact source palette is not a claim of identical encoded pixels. Full-speed perceptual review and user acceptance are pending.

## Longer-copy revision and font fallback

The editorial composition was duplicated, retaining the original exact copy. Its support became “Independent books. Unexpected discoveries.” plus “A place for curious readers.” on a second line. A deliberately unavailable requested font was resolved to caller-approved Avenir-Book, with a warning and remeasurement. AESType.fit kept the complete string at 52px inside 1440×190 source-space bounds; overflow was false. Existing transform/opacity keys were deliberately retimed on the owned duplicate from 5–5.8s to 4.8–5.6s, preserving easing and the original composition.

Four native revision frames and the decoded landing were inspected: complete copy, readable line separation and no rule collision. The 10s revision movie fully decodes. This demonstrates copy/pacing revision and fallback, not permission to rewrite user-approved wording. Choose a new layout rather than silently truncate when longer copy cannot fit.

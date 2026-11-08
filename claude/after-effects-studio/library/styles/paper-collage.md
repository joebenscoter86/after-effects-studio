# Paper collage: material and motion profile

Paper collage is a flat stage assembled from discrete cut pieces. Make material legible through irregular edges, a narrow border where useful, restrained grain, contact shadow and a softer offset shadow. Let overlaps explain depth and sequence. A photograph, printed frame or image sequence is optional; native cardstock shapes alone can tell an abstract story. Do not describe a native geometric substitute as a photographed object.

## Set the visual hierarchy

Start with one viewer takeaway, then choose 3–6 significant pieces rather than many scraps. Give each piece a reason to enter, cover, reveal, carry or leave. A piece should survive a transition when continuity matters; avoid a finished collage that simply fades in. Preserve clear negative space for text and a resolved hold. Treat the frame like a tabletop; camera movement is optional and needs a story reason.

Build a material hierarchy, not a sequence of interchangeable title cards. Decide what acts as substrate, what is cut and placed above it, and which edge or seam carries the story into the next beat. Vary silhouette, scale, overlap and edge treatment where their roles differ; align contact and offset shadows to one light source. If removing the grain would leave only straight-sided boxes with the same font treatment, redesign the paper forms and the transition before adding more texture. Native shapes can still have deliberate folds, torn contours, cut windows and physical occlusion without pretending to be photographs.

An irregular polygon alone is not enough to read as paper. Give the foreground piece a deliberate edge, fold, cut window, tape join or narrow contact shadow that distinguishes it from the backing sheet, then inspect that material cue at delivery size. Keep such details subordinate to the message; extra scraps do not improve a flat composition by count alone.

Prove the primary sheet as material before multiplying pieces. Render a full-resolution still over the intended ground, then inspect a playback-size view and an encoded movie frame. Its interior needs visible low-amplitude stock variation rather than a uniform fill; its perimeter needs a discernible cut/rough edge; and its contact plus softer lift shadow must distinguish it from the backer. An accent dot, tape triangle or offset card cannot substitute for those cues. If compression erases the grain, raise its visibility carefully or use a rights-cleared stock asset; keep typography legible and disclose when a native treatment remains an approximation of physical paper.

Carry the material system into the payoff. If every substantial sheet exits and only a tiny event label plus a corner outline remains, the last frame reads like ordinary type on a blank slide. Keep the invitation visibly seated on a paper surface or inside a purposeful paper opening, with a backing/foreground relationship still readable at the final hold. The native helper's restrained Roughen Edges, Noise and shadow treatment, or an equivalent tested native treatment, can support this; a plain polygon and generic drop shadow are a blockout when the brief asks for tactile stock.

Choose palette roles rather than house colors: ground paper, ink, accent and optional second cardstock tone. JoeB cream/navy/vermilion is an opt-in appearance. Pick typography for the audience and topic. Keep words on native text layers whenever practical. Text and guides can move smoothly at comp frame rate even when paper pieces move in sampled steps; stepping every label makes reading harder.

Text placed on photographic paper needs its own material treatment. A perfectly uniform digital fill, upright baseline and clean alpha edge can read as a floating overlay even when the stock looks real. Choose a lettering style that fits the subject, keep the source text editable, align its angle and movement with the paper, blend dark ink with the surface, and introduce restrained edge and pigment variation. Preserve enough contrast and hold time to read. A hand-lettered font is one option, not a requirement or a font bundled with this plugin.

When the announcement combines expressive type with collage, make the text roles visibly distinct and relate their entrance to the paper action. A named event or subject should remain identifiable while the final invitation is read, either as native type on the settled surface or through a clear persistent visual anchor. Do not let the last card discard the subject and become an anonymous call to action. Preserve the exact supplied copy and avoid repeating a line solely to satisfy this rule.

Reserve a text-safe area on each paper surface using the measured native text bounds after font resolution. In the settled reading pose, foreground scraps, folds and their shadows must clear essential glyphs and line spacing. Partial occlusion can serve an entrance, but it must finish before the reading hold. Inspect both the headline and the final invitation in full-size delivered frames; a visually attractive cut shape that crosses a word is a failed composition, not a material upgrade.

## Material choices

- **Paper:** a slightly irregular vector contour, matte fill, low-amplitude native noise and enough shadow separation to read against the ground. A thick soft shadow or aggressive noise can look like a digital sticker or damaged video.
- **Cutout:** a readable silhouette at the final viewing size, a consistent border, and a shadow cast in the same lighting direction as nearby pieces. Vary overlap deliberately. Inspect the contact edge at full resolution for pale fringes and hard seams.
- **Photographic print, if supplied:** use an image with enough resolution for its largest crop, a clean alpha or deliberate printed-paper rectangle, and documented rights. Processed halftone may suit the brief but is not required by the native fallback. Keep real evidence recognizable; do not invent an object when no faithful input exists.
- **Ink on paper:** default to lettering as AE text above the paper. Use Multiply or another tested ink blend, restrained opacity, a small static edge irregularity and fine alpha grain. Match the card angle. Never add a text shadow that makes the letters hover. Check full-size decoded frames for broken counters, excessive speckle and paper color showing through so strongly that the words fade. If a photoreal handwritten treatment is essential and native text remains visibly overlaid, an optional generated paper plate can carry the visible ink; keep Source Text as the copy record and disclose that each changed line requires asset refresh. See `paper-collage-recipes` for that bounded route.

Native paper and treatment mechanics are in `paper-collage-recipes` and `paper-collage-jsx`. Their built-in Roughen Edges, Noise and Drop Shadow controls approximate a paper surface. They do not reproduce fiber scans or photographic halftone. A supplied asset or optional generator may add that material when the brief needs it.

## Motion grammar

Move pieces as if a hand placed them: a clear origin, travel, contact and short settle. A cut, separation or reveal must keep the object registered across the handoff. Use sampled `stepHz` on cutout position/rotation when tactile jitter helps; choose the seed explicitly so unrelated layer insertion does not change the result. A calm variant uses intensity zero, no boil or flicker, fewer events and a longer settled hold. Text movement is decided separately. Do not claim this setting certifies accessibility.

At 12 Hz, sampled jitter holds two frames at 24 fps and five at 60 fps; at 30 fps it alternates two and three frames. Underlying authored keyframes may still move every frame. If the material feels nervous, reduce intensity or stop the boil rather than slowing all copy and camera movement.

## Asset contract and review

For supplied art, record source and permission, alpha quality, pixel dimensions and intended largest on-screen scale. Inspect edge extraction over both light and dark backgrounds. Ask for a real object image only when depicting that exact object is material to the brief; otherwise use and disclose an abstract native treatment. Do not bundle commercial fonts, purchased templates, private media or the Content repository.

Review the first readable frame, entry, closest overlap, hardest transition and final hold at full resolution. Check legibility, silhouette, shadow direction, seams, alpha halos and whether motion serves the message. A complete movie decode does not establish perceptual rhythm; watch playback when available and distinguish controller review from user acceptance.

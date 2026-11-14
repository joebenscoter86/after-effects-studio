---
name: visual-styles
description: Build After Effects motion graphics in a named visual style from the bundled style library: Art Deco, Liminal found footage, Blueprint, CRT terminal, Dark keynote, Data storytelling, Copperplate engraving, Game Show, Glass product, Halftone dossier, Hologram HUD, Isometric infographic, Living screencast, Low-poly island, Microgame frenzy, Mid-century cartoon, One-line drawing, Paper-cut lightbox, Pictogram motion, Pixel headline, Risograph print, Rubber hose cartoon, Silent film, Silkscreen poster, Spy titles, Stained glass, Swiss motion, Tilt-shift miniature, Ukiyo-e woodblock print, Whiteboard explainer or Woodcut print. Use when the user names one of these looks, asks which styles are available, or wants help choosing a style; ordinary motion work without a named look does not need it.
---

# Visual styles

31 visual styles, each with a written grammar (type, colour, motion, camera), an After Effects recipe and an ES3 module. Also available: **Paper collage** (`paper-collage`), which has its own skill and library module.

Read through `ae_library`: **motion-language**, **production-workflow** and **brief-template** first (the foundation for every style), then the chosen style's **style-<id>**. The table below already holds what `style-index` lists; read the index only for a style's tools or its proof status. If the library tool is unavailable, the same files are at `../../library/styles/<id>/STYLE.md` and `../../library/styles/index.json` relative to this skill's folder.

1. Choose the style with the user from the table. If they describe a look that is not listed, name the closest style and say how it differs.
2. Write the brief in the style's grammar (STYLE.md sections 2 to 4), adapted to the user's subject. A style is a grammar, not a template.
3. Fonts: each style uses the free (OFL) families in the Fonts column, from Google Fonts; none are included. A module's `fontOK()` stops the build when one is missing. Install the family, or substitute the closest installed family of the same kind by replacing the family name in the module text before loading it, and remeasure the text.
4. Tools: most styles prepare footage or stills with small Node scripts that use ffmpeg; the 3D styles render plates with Blender. Ask before running one; it reads the input files you name and writes to a cache folder you choose, replacing its own earlier outputs there. The 3D plate scripts render the library's seven-beat test scene format (`scene.json` with the beats title, picture, input, number, line, carry and end, plus `words.json`); for the user's own scene, adapt the script's beats or build the recipe's native layers without plates.
5. Build natively with `ae_do` and `eval.run`. Each `eval.run` call runs in its own function scope, so load the shared helpers and the style's module in the same call as the code that uses them, for example `$.evalFile(File(LIB + "/styles/aes-lib.jsx")); $.evalFile(File(LIB + "/styles/<id>/<module>"));` followed by your build code, where `LIB` is the absolute path of the `library` folder two levels above this skill's folder. Follow the AE recipe (STYLE.md section 6). The module's `buildScene(comp, scene, opts)` builds the library's seven-beat test scene; read it as a worked example of the technique, not as a builder for the user's scene. Its captions and labels are the test scene's own lines, written into the module, and its timings assume about ten seconds for the seven beats; if you call it with the user's `scene.json` (the 3D plates need that format), replace those lines and give each beat at least a second.
6. Render frames and check them against STYLE.md before showing the user.

A STYLE.md longer than one `ae_library` reply comes as its outline and opening first, and says so on its first lines. Read the sections the job needs with `section`, several in one call, before building; the opening says which sections serve which job.

The styles are adaptations of Lemo-Opuscar (MIT, LemoLab), except Pixel headline: it is the plugin's own, written from its own measurements (`origin` is `plugin` in `style-index`, and `proofNote` says how far it is tested). In `style-index`, `contentStatus` and `contentProof` record that a style was proven in the author's own proof setup before import; `pluginProof` stays null until the style has been built and checked through this plugin. Say which applies when you present a style.

Pixel headline is the plugin's own style; read its STYLE.md for what was measured and how far it is tested.

| Style | id | Tier | Good for | Fonts | Needs |
|---|---|---|---|---|---|
| Art Deco | `art-deco` | native | A premium reveal or a big announcement that should feel like an event | Limelight, Poiret One, Josefin Sans | ffmpeg, node |
| Liminal found footage | `backrooms` | 3d | Something eerie or unsettling, a 'nobody warned me about this' story | VT323, IBM Plex Mono, Barlow Semi Condensed | blender, ffmpeg, node |
| Blueprint | `blueprint` | native | How something works, an architecture or system explained part by part | Architects Daughter, B612 | ffmpeg, node |
| CRT terminal | `crt-terminal` | native | Anything about code, terminals or what the AI is really doing underneath | VT323 | ffmpeg, node |
| Dark keynote | `dark-keynote` | native | A product or feature launch where the interface is the star | Inter Tight, IBM Plex Mono | none |
| Data storytelling | `dataviz` | native | A real number or a before-and-after that carries the point | Newsreader, IBM Plex Mono, Caveat | ffmpeg, node |
| Copperplate engraving | `engraving` | print | A deep dive or field guide that should feel scholarly | Bodoni Moda, Pinyon Script | ffmpeg, node |
| Game Show | `game-show` | native | A list, a quiz or a countdown with high energy | Fredoka | ffmpeg, node |
| Glass product | `glass-product` | 3d | A hero product reveal that should feel like a premium product launch | Inter Tight | blender, ffmpeg, node |
| Halftone dossier | `halftone-dossier` | print | Investigating something: case files, receipts, 'here is the evidence' | Newsreader, Titan One, Space Mono, Anton | ffmpeg, node |
| Hologram HUD | `hologram-hud` | native | Scanning or analysing something; breaking a thing into labelled parts | Rajdhani, Share Tech Mono | ffmpeg, node |
| Isometric infographic | `iso-infographic` | native | A workflow or system with several parts that connect | Poppins | none |
| Living screencast | `living-screencast` | native | Walking through a real app or tool on screen | Inter Tight, Newsreader, IBM Plex Mono | ffmpeg, node |
| Low-poly island | `lowpoly-island` | 3d | Something that grows over time, a project or system built up piece by piece | Josefin Sans, Fredoka | blender, node |
| Microgame frenzy | `microgame` | native | Rapid-fire tips, one per beat, each in a different look | Titan One, Lilita One, Silkscreen, Inter Tight, VT323, Caveat | ffmpeg, node |
| Mid-century cartoon | `midcentury-toon` | painterly | A how-to or tutorial with a friendly presenter | Oleo Script, Alfa Slab One, Jost | ffmpeg, node |
| One-line drawing | `one-line` | native | One idea that connects everything; elegant and minimal | Caveat | ffmpeg, node |
| Paper-cut lightbox | `paper-lantern` | print | A warm, story-like moment told in layers of light | Cormorant Garamond | none |
| Pictogram motion | `pictogram-motion` | native | A fast list of facts or steps on a strong beat | Inter Tight, Space Mono | ffmpeg, node |
| Pixel headline | `pixel-headline` | native | A whole talking-head reel, built by a director agent from a script and a take, where one stressed word per sentence should hit hard and forty seconds must stay in one style | Inter | none |
| Risograph print | `risograph` | print | A zine-feeling explainer with indie, creative energy | Archivo Black, Josefin Sans | ffmpeg, node |
| Rubber hose cartoon | `rubber-hose` | painterly | A comedic bit where an object comes alive | Shrikhand, Limelight, IM FELL English SC | ffmpeg, node |
| Silent film | `silent-film` | native | An old-way-versus-new-way contrast, played for laughs | Playfair Display SC, Old Standard TT | ffmpeg, node |
| Silkscreen poster | `silkscreen-poster` | print | A destination or a big promise sold like a travel poster | Big Shoulders Display, Outfit | ffmpeg, node |
| Spy titles | `spy-titles` | native | A secret, a hack or a mission; something with intrigue | Bebas Neue, Anton | ffmpeg, node |
| Stained glass | `stained-glass` | print | A big, reverent idea; something that feels like a revelation | Cinzel, IM FELL English | ffmpeg, node |
| Swiss motion | `swiss-motion` | native | A clean, confident statement; the design-forward default | Inter Tight | ffmpeg, node |
| Tilt-shift miniature | `tilt-shift` | 3d | Zooming out on a busy system; the big-picture view | Barlow Semi Condensed, IBM Plex Mono | blender, ffmpeg, node |
| Ukiyo-e woodblock print | `ukiyoe` | print | A journey or a landscape of ideas, told scroll by scroll | Shippori Mincho | ffmpeg, node |
| Whiteboard explainer | `whiteboard` | native | Teaching a concept from scratch, explained as you'd draw it | Architects Daughter | ffmpeg, node |
| Woodcut print | `woodcut` | print | A bold, serious statement with grit | IM FELL English SC, IM FELL English | ffmpeg, node |
